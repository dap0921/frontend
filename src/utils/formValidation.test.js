import { validateForm } from './formValidation';

describe('validateForm', () => {
  it('returns true when the form is valid', () => {
    const form = {
      checkValidity: jest.fn(() => true),
      reportValidity: jest.fn(),
    };

    expect(validateForm({ currentTarget: form })).toBe(true);
    expect(form.reportValidity).not.toHaveBeenCalled();
  });

  it('reports invalid fields and returns false', () => {
    const form = {
      checkValidity: jest.fn(() => false),
      reportValidity: jest.fn(),
    };

    expect(validateForm({ currentTarget: form })).toBe(false);
    expect(form.reportValidity).toHaveBeenCalledTimes(1);
  });
});
