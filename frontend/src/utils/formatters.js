export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0.00';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (date, format = 'dd MMM yyyy') => {
  if (!date) return '-';

  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const monthShort = d.toLocaleString('en-IN', { month: 'short' });
  const monthLong = d.toLocaleString('en-IN', { month: 'long' });
  const year = d.getFullYear();

  if (format === 'dd MMM yyyy') {
    return `${day} ${monthShort} ${year}`;
  }

  if (format === 'MMMM YYYY') {
    return `${monthLong} ${year}`;
  }

  if (format === 'MMM DD, YYYY') {
    return `${monthShort} ${day}, ${year}`;
  }

  if (format === 'YYYY-MM') {
    return `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  return d.toLocaleDateString('en-IN');
};

export const formatMonth = (monthString) => {
  // "2024-12" -> "December 2024"
  if (!monthString) return '-';

  const [year, month] = monthString.split('-');
  const date = new Date(year, month - 1);

  return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};

export const formatRelativeTime = (date) => {
  if (!date) return '';

  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(date);
};

export const getInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return '?';
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${first}${last}`;
};