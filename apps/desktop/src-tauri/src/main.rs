// Evita una consola adicional en Windows en la compilación de publicación.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    windgets_lib::run()
}
