import Swal from 'sweetalert2';

/**
 * Show a beautiful confirmation dialog for critical actions
 * @param {Object} options - Configuration options
 * @param {string} options.title - Dialog title
 * @param {string} options.text - Dialog description
 * @param {string} options.icon - Icon type: 'warning', 'error', 'success', 'info', 'question'
 * @param {string} options.confirmButtonText - Confirm button text
 * @param {string} options.cancelButtonText - Cancel button text
 * @param {string} options.confirmButtonColor - Confirm button color
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
export const showConfirmation = async ({
    title = 'Are you sure?',
    text = 'This action cannot be undone.',
    icon = 'warning',
    confirmButtonText = 'Yes, proceed',
    cancelButtonText = 'Cancel',
    confirmButtonColor = '#1890ff',
    dangerMode = false,
}) => {
    const result = await Swal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonColor: dangerMode ? '#ff4d4f' : confirmButtonColor,
        cancelButtonColor: '#d9d9d9',
        confirmButtonText,
        cancelButtonText,
        reverseButtons: true,
        customClass: {
            popup: 'swal-popup',
            confirmButton: 'swal-confirm',
            cancelButton: 'swal-cancel',
        },
        buttonsStyling: true,
    });

    return result.isConfirmed;
};

/**
 * Show a success message
 */
export const showSuccess = (title, text = '') => {
    return Swal.fire({
        title,
        text,
        icon: 'success',
        confirmButtonColor: '#52c41a',
        confirmButtonText: 'Great!',
    });
};

/**
 * Show an error message
 */
export const showError = (title, text = '') => {
    return Swal.fire({
        title,
        text,
        icon: 'error',
        confirmButtonColor: '#ff4d4f',
        confirmButtonText: 'Okay',
    });
};

/**
 * Preset: Delete confirmation
 */
export const confirmDelete = (itemName = 'this item') => {
    return showConfirmation({
        title: 'Delete Confirmation',
        text: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
        icon: 'warning',
        confirmButtonText: 'Yes, delete it',
        dangerMode: true,
    });
};

/**
 * Preset: Approve confirmation
 */
export const confirmApprove = (itemName = 'this') => {
    return showConfirmation({
        title: 'Approve Confirmation',
        text: `Are you sure you want to approve ${itemName}?`,
        icon: 'question',
        confirmButtonText: 'Yes, approve',
        confirmButtonColor: '#52c41a',
    });
};

/**
 * Preset: Payment confirmation
 */
export const confirmPayment = (amount, employeeName = '') => {
    return showConfirmation({
        title: 'Payment Confirmation',
        text: employeeName
            ? `Confirm payment of ${amount} to ${employeeName}?`
            : `Confirm payment of ${amount}?`,
        icon: 'question',
        confirmButtonText: 'Yes, mark as paid',
        confirmButtonColor: '#52c41a',
    });
};

export default {
    showConfirmation,
    showSuccess,
    showError,
    confirmDelete,
    confirmApprove,
    confirmPayment,
};
