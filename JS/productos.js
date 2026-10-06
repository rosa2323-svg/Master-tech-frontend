// Catalogo local inicial. Categorias = las del navbar: laptops, telefonos, accesorios, componentes.
const PRODUCTOS_INICIALES = [
    { id: 1,  nombre: "Laptop Gamer 15.6\"",        marca: "Lenovo", categoria: "laptops",     precio: 3299.00, stock: 6,  imagen: "laptoppromo.jpeg",
        especificaciones: { "Pantalla": "15.6\" FHD 144Hz", "Procesador": "AMD Ryzen", "Memoria RAM": "16GB", "Almacenamiento": "512GB SSD", "Gráficos": "NVIDIA GeForce RTX 4050 6GB" } },
    { id: 2,  nombre: "PC de Escritorio Ryzen 5",   marca: "Master Tech", categoria: "laptops",     precio: 2899.00, stock: 4,  imagen: "pcpromo.jpg",
        especificaciones: { "Procesador": "AMD Ryzen 5", "Memoria RAM": "16GB", "Almacenamiento": "512GB SSD", "Sistema operativo": "Windows 11" } },
    { id: 3,  nombre: "iPhone 256 GB",              marca: "Apple",       categoria: "telefonos",   precio: 4299.00, stock: 3,  imagen: "iPhone256.jpg",
        especificaciones: { "Almacenamiento": "256GB", "Garantía": "12 meses" } },
    { id: 4,  nombre: "Smartphone Gama Media",      marca: "Apple", categoria: "telefonos",   precio: 899.00,  stock: 12, imagen: "telefonopromo.jpg",
        especificaciones: { "Gama": "Media", "Garantía": "12 meses" } },
    { id: 5,  nombre: "Mouse Gamer RGB",            marca: "Logitech",    categoria: "accesorios",  precio: 189.00,  stock: 15, imagen: "mouse2.jpg",
        especificaciones: { "Tipo": "Mouse gamer", "Iluminación": "RGB" } },
    { id: 6,  nombre: "Consola PlayStation 5",      marca: "Sony",        categoria: "accesorios",  precio: 2199.00, stock: 5,  imagen: "ps5.jpg",
        especificaciones: { "Tipo": "Consola de videojuegos", "Garantía": "12 meses" } },
    { id: 7,  nombre: "Nintendo Switch OLED",       marca: "Nintendo",    categoria: "accesorios",  precio: 1399.00, stock: 0,  imagen: "nintenswitch.jpg",
        especificaciones: { "Tipo": "Consola portátil", "Pantalla": "OLED" } },
    { id: 8,  nombre: "Kit de Componentes PC",      marca: "AMD", categoria: "componentes", precio: 1299.00, stock: 8,  imagen: "componentesicon.jpeg",
        especificaciones: { "Tipo": "Kit para armado de PC", "Garantía": "12 meses" } }
];

// Si el admin ya guardó cambios, la tienda lee ese catálogo; si no, usa el inicial.
const CLAVE_PRODUCTOS = "mastertech_productos";
const productos = (() => {
    try {
        const guardado = JSON.parse(localStorage.getItem(CLAVE_PRODUCTOS));
        return Array.isArray(guardado) ? guardado : PRODUCTOS_INICIALES;
    } catch {
        return PRODUCTOS_INICIALES;
    }
})();
