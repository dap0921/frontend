import api from '../api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateForm } from '../utils/formValidation';

function AddUser() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{6,15}$/;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Phone must contain 6 to 15 digits';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(e)) return;

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setServerError('');
    setLoading(true);

    try {
      const response = await api.post(
        '/add-user',
        formData
      );

      console.log('User added:', response.data);

      if (response.data.data) {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error('Add user error:', error);

      setServerError(
        error.response?.data?.message ||
        error.response?.data?.errorMessage ||
        'Unable to add user.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const inputClass = (field) =>
    `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field]
        ? 'border-red-500'
        : 'border-gray-300'
    }`;

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">

      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">

          <h2 className="text-xl font-semibold text-gray-800">
            Add User
          </h2>

          <button
            type="button"
            onClick={handleCancel}
            className="text-sm text-blue-600 hover:underline"
          >
            &larr; Back to list
          </button>

        </div>

        {/* Server Error */}
        {serverError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Name */}
          <div className="mb-4">

            <label
              htmlFor="add-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>

            <input
              type="text"
              id="add-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={100}
              className={inputClass('name')}
              placeholder="Enter full name"
            />

            {errors.name && (
              <p className="text-red-500 text-sm mt-1">
                {errors.name}
              </p>
            )}

          </div>

          {/* Email */}
          <div className="mb-4">

            <label
              htmlFor="add-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>

            <input
              type="email"
              id="add-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              maxLength={254}
              className={inputClass('email')}
              placeholder="you@example.com"
            />

            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email}
              </p>
            )}

          </div>

          {/* Password */}
          <div className="mb-4">

            <label
              htmlFor="add-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>

            <input
              type="password"
              id="add-password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className={inputClass('password')}
              placeholder="Enter password"
            />

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password}
              </p>
            )}

          </div>

          {/* Phone */}
          <div className="mb-4">

            <label
              htmlFor="add-phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone
            </label>

            <input
              type="tel"
              id="add-phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              pattern="[0-9]{6,15}"
              maxLength={15}
              inputMode="numeric"
              className={inputClass('phone')}
              placeholder="Enter phone number"
            />

            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">
                {errors.phone}
              </p>
            )}

          </div>

          {/* Address */}
          <div className="mb-6">

            <label
              htmlFor="add-address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Address
            </label>

            <textarea
              id="add-address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              maxLength={500}
              rows="3"
              className={inputClass('address')}
              placeholder="Enter address"
            />

            {errors.address && (
              <p className="text-red-500 text-sm mt-1">
                {errors.address}
              </p>
            )}

          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-md"
            >
              {loading ? 'Adding...' : 'Add User'}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default AddUser;
