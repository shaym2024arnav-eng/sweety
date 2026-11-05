import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingForm from '../components/ReadingForm';
import { ApiError } from '../api/client';

const TODAY = '2026-10-15';

function setup(props = {}) {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(<ReadingForm today={TODAY} onSubmit={onSubmit} {...props} />);
  return {
    user,
    onSubmit,
    value: screen.getByLabelText(/glucose/i),
    date: screen.getByLabelText(/date/i),
    slot: screen.getByLabelText(/time slot/i),
    submit: screen.getByRole('button', { name: /add reading/i }),
  };
}

describe('ReadingForm', () => {
  test('shows an error when the value is empty and does not submit', async () => {
    const { user, submit, onSubmit } = setup();
    await user.click(submit);
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a glucose value.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test.each(['39', '601', '120.5'])('rejects value %s with the range message', async (input) => {
    const { user, value, submit, onSubmit } = setup();
    await user.type(value, input);
    await user.click(submit);
    expect(screen.getByRole('alert')).toHaveTextContent('Value must be between 40 and 600 mg/dl.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('rejects a future date', async () => {
    const { user, value, date, submit } = setup();
    await user.clear(date);
    await user.type(date, '2026-10-16');
    await user.type(value, '120');
    await user.click(submit);
    expect(screen.getByRole('alert')).toHaveTextContent('Date cannot be in the future.');
  });

  test('submits a valid reading as a number and clears the value afterwards', async () => {
    const { user, value, slot, submit, onSubmit } = setup();
    await user.selectOptions(slot, 'after_lunch');
    await user.type(value, '145');
    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledWith({ reading_date: TODAY, slot: 'after_lunch', value: 145 });
    expect(value).toHaveValue(null);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('shows the server error message (e.g. duplicate slot)', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError('You already have an After lunch reading for this date.', 409, 'slot'));
    const { user, value, slot, submit } = setup({ onSubmit });
    await user.selectOptions(slot, 'after_lunch');
    await user.type(value, '145');
    await user.click(submit);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You already have an After lunch reading for this date.',
    );
    expect(value).toHaveValue(145); // keeps what the user typed
  });

  test('clears the error once the user edits the field', async () => {
    const { user, value, submit } = setup();
    await user.click(submit);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.type(value, '1');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('edit mode is pre-filled with the existing reading', () => {
    render(
      <ReadingForm
        today={TODAY}
        initial={{ reading_date: '2026-10-10', slot: 'after_dinner', value: 188 }}
        submitLabel="Save changes"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/glucose/i)).toHaveValue(188);
    expect(screen.getByLabelText(/time slot/i)).toHaveValue('after_dinner');
    expect(screen.getByLabelText(/date/i)).toHaveValue('2026-10-10');
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });
});
