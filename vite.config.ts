import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        proxy: {
            // Forward API requests starting with "/api" to your backend server
            "/api": {
                target: "http://localhost:3000", // Your Node.js server's address
                changeOrigin: true,
                rewrite: (path) => path, // Remove the "/api" prefix when forwarding
            },
        },
    },
    // build: {
    //     minify: false, // Disable minification
    //     sourcemap: true, // Generate sourcemaps for debugging
    // },
});
