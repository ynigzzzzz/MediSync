export function useRoute() {
    const route = (name, params = {}) => {
        // Map route names to URLs
        const routes = {
            // Auth routes
            'login': '/login',
            'password.request': '/forgot-password',
            'password.email': '/forgot-password',
            'password.reset': '/reset-password',
            'password.store': '/reset-password',
            'password.confirm': '/confirm-password',
            'logout': '/logout',
            
            // Dashboard
            'dashboard': '/dashboard',
            
            // Profile
            'profile.edit': '/profile',
            'profile.update': '/profile',
            'profile.destroy': '/profile',
            
            // Medicine Catalog
            'medicine-list.index': '/medicine-list',
            
            // Stock Receiving
            'stock-receiving.index': '/stock-receiving',
            'stock-receiving.store': '/stock-receiving',
            'stock-receiving.destroy': '/stock-receiving/{stockIn}',
            
            // Dispensing
            'dispensing.index': '/dispensing',
            
            // Transaction History
            'transaction-history.index': '/transaction-history',
            
            // User Management
            'user-management.index': '/user-management',
        };

        let path = routes[name] || `/${name}`;

        // Replace parameters (e.g., {stockIn} -> 123)
        Object.entries(params).forEach(([key, value]) => {
            path = path.replace(`{${key}}`, value);
        });

        return path;
    };

    return { route };
}