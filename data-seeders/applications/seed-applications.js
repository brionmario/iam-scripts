#!/usr/bin/env node

/**
 * MIT License
 *
 * Copyright (c) 2024, Brion Mario
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import fs from "fs";
import https from "https";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import loadEnvFiles from "../../utils/load-dotenv-files.js";

// Get the current directory name (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env files.
loadEnvFiles();

/**
 * Get the authorization token and base URL from environment variables.
 */
const AUTHORIZATION = process.env.AUTHORIZATION;
const BASE_URL = process.env.IS_BASE_URL;

if (!AUTHORIZATION) {
    console.error("AUTHORIZATION environment variable is not set.");
    process.exit(1);
}

// Get the version from the command-line arguments
const args = process.argv.slice(2);
const versionArg = args.find(arg => arg.startsWith("--version="));
const operationArg = args.find(arg => arg.startsWith("--operation="));
const limitArg = args.find(arg => arg.startsWith("--limit="));
const version = versionArg ? versionArg.split("=")[1] : null;
const operation = operationArg ? operationArg.split("=")[1] : "create";
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 50;

if (!version) {
    console.error("Version is required. Use the --version=<version> argument.");
    process.exit(1);
}

console.log(`Using Identity Server version: ${version}`);

async function createApplications(limit) {
    try {
        const payloadFile = path.resolve(__dirname, "versions", version, "payload.json");
        const data = fs.readFileSync(payloadFile, "utf8");
        const applications = JSON.parse(data);

        if (!applications) {
            throw new Error("Invalid payload structure");
        }

        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        for (let i = 0; i < limit && i < applications.length; i++) {
            const application = applications[i];

            console.log("Processing application:", application);

            try {
                const response = await axios.post(`${BASE_URL}/api/server/v1/applications`, application, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: AUTHORIZATION
                    },
                    httpsAgent: agent
                });

                console.log(`Application created: ${application.name} - Response:`, response.data);
            } catch (error) {
                console.error(
                    `Failed to create application ${application.name}:`,
                    error.response ? error.response.data : error.message
                );
            }
        }
    } catch (error) {
        console.error(`Error reading the payload file: ${error.message}`);
    }
}

async function deleteApplications() {
    try {
        let response = null;

        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        try {
            response = await axios.get(`${BASE_URL}/api/server/v1/applications?limit=50`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: AUTHORIZATION
                },
                httpsAgent: agent
            });
        } catch (error) {
            console.error("Failed to get applications:", error.response ? error.response.data : error.message);
        }

        if (!response || !response.data.applications) {
            throw new Error("Invalid payload structure");
        }

        for (const application of response.data.applications) {
            console.log("Processing application:", application);

            try {
                const response = await axios.delete(
                    `${BASE_URL}/api/server/v1/applications/${application._id}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: AUTHORIZATION
                        },
                        httpsAgent: agent
                    }
                );

                console.log(`Application deleted: ${application.name} - Response:`, response.data);
            } catch (error) {
                console.error(
                    `Failed to delete application ${application.name}:`,
                    error.response ? error.response.data : error.message
                );
            }
        }
    } catch (error) {
        console.error(`Error reading the payload file: ${error.message}`);
    }
}

if (operation === "create") {
    createApplications(limit);
} else if (operation === "delete") {
    deleteApplications();
} else {
    console.error("Invalid operation. Use 'create' or 'delete'.");
}