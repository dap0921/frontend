import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import api from '../api';
import Login from './Login';

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

test('requests an email code and submits it with the new password', async () => {
  api.post
    .mockResolvedValueOnce({ data: { message: 'Code requested.' } })
    .mockResolvedValueOnce({ data: { message: 'Password reset.' } });

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: 'person@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: /send verification code/i }));

  expect(await screen.findByLabelText(/6-digit verification code/i)).toBeInTheDocument();
  expect(api.post).toHaveBeenNthCalledWith(1, '/forgot-password', {
    email: 'person@example.com',
    role: 'user',
  });

  fireEvent.change(screen.getByLabelText(/6-digit verification code/i), {
    target: { value: '123456' },
  });
  fireEvent.change(screen.getByLabelText(/^new password$/i), {
    target: { value: 'newpassword' },
  });
  fireEvent.change(screen.getByLabelText(/confirm new password/i), {
    target: { value: 'newpassword' },
  });
  fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

  await waitFor(() => {
    expect(api.post).toHaveBeenNthCalledWith(2, '/reset-password', {
      email: 'person@example.com',
      role: 'user',
      code: '123456',
      password: 'newpassword',
    });
  });
  expect(await screen.findByText(/password reset successfully/i)).toBeInTheDocument();
});

test('shows an error and does not advance when the email is not registered', async () => {
  api.post.mockRejectedValueOnce({
    response: {
      status: 404,
      data: { message: 'This email is not registered for the selected account type.' },
    },
  });

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: 'unknown@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: /send verification code/i }));

  expect(
    await screen.findByRole('alert')
  ).toHaveTextContent('This email is not registered for the selected account type.');
  expect(screen.queryByLabelText(/6-digit verification code/i)).not.toBeInTheDocument();
});
