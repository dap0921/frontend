export function validateForm(event) {
  const form = event.currentTarget;

  if (form.checkValidity()) {
    return true;
  }

  form.reportValidity();
  return false;
}
