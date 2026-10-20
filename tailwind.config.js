import forms from '@tailwindcss/forms';
import animate from 'tailwindcss-animate';

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
    sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
},
            colors: {
                // ── MediSync palette (from the original dashboard.php :root variables) ──
                'cherry-blossom': '#FFB7CE',
                'burnt-rose': '#764248',
                'charcoal-blue': '#2C3E50',
                'eggshell': '#DFE2CF',
                'success-green': '#2E7D64',
                'warning-orange': '#E67E22',
                'critical-red': '#DC3545',
                'notice-amber': '#F39C12',

                // ── shadcn tokens (values come from the CSS variables in app.css) ──
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            backgroundImage: {
                // Named gradients so we never need inline style props
                'sidebar-gradient': 'linear-gradient(180deg, #fff0f5 0%, #ffe4ee 60%, #ffd6e7 100%)',
                'logo-gradient': 'linear-gradient(135deg, #FFB7CE 0%, #f48fb1 100%)',
                'brand-gradient': 'linear-gradient(135deg, #FFB7CE 0%, #764248 100%)',
                'login-hero': 'linear-gradient(135deg, #FFB7CE 0%, #764248 100%)',
            },
        },
    },
    plugins: [forms, animate],
};