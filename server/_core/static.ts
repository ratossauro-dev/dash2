import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
    // Try standard production path first (dist/public relative to dist/index.js)
    let distPath = path.resolve(import.meta.dirname, "public");

    // If that doesn't exist, try the development/fallback path
    if (!fs.existsSync(distPath)) {
        const fallbackPath = path.resolve(import.meta.dirname, "../..", "dist", "public");
        if (fs.existsSync(fallbackPath)) {
            distPath = fallbackPath;
        }
    }

    if (!fs.existsSync(distPath)) {
        console.error(
            `[Static] Error: Build directory not found. Tried paths: 
            1. ${path.resolve(import.meta.dirname, "public")}
            2. ${path.resolve(import.meta.dirname, "../..", "dist", "public")}`
        );
    } else {
        console.log(`[Static] Serving files from: ${distPath}`);
    }

    app.use(express.static(distPath));

    // fall through to index.html if the file doesn't exist
    app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
    });
}
