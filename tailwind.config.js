import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Poppins', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
            },
            colors: {
                // Exact palette from the original dashboard.php :root variables
                'cherry-blossom': '#FFB7CE',
                'burnt-rose': '#764248',
                'charcoal-blue': '#2C3E50',
                'eggshell': '#DFE2CF',
                'success-green': '#2E7D64',
                'warning-orange': '#E67E22',
                'critical-red': '#DC3545',
                'notice-amber': '#F39C12',
            },
        },
    },

    plugins: [forms],
};
