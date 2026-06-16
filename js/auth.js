// js/auth.js

// 1. Guardián de seguridad: Si no está logueado, redirige al login
if (localStorage.getItem('isLoggedIn') !== 'true') {
    // Si estás en el index.html esto podría causar un bucle, 
    // por eso validamos que no intente redirigir si ya estás en el login
    if (!window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

// 2. Función de Cerrar Sesión (Forzada de forma global)
window.logout = function() {
    // Limpiamos los datos de sesión del localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    
    // Forzamos la redirección inmediata al Login
    window.location.replace('index.html');
};