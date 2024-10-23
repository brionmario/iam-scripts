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

const fs = require("fs");
const https = require("https");
const path = require("path");
const axios = require("axios");
const dotenv = require("dotenv");
const loadEnvFiles = require('../../utils/load-dotenv-files');

// Load environment variables from .env files.
loadEnvFiles();

/**
 * Get the authorization token from environment variables.
 */
const AUTHORIZATION = process.env.AUTHORIZATION;
const BASE_URL = "https://localhost:9443";
const payloadFile = path.resolve("payloads.json");

if (!AUTHORIZATION) {
    console.error("AUTHORIZATION environment variable is not set.");
    process.exit(1);
}

async function createTenants(limit) {
    try {
        const data = fs.readFileSync(payloadFile, "utf8");
        const tenants = JSON.parse(data);

        if (!tenants || !tenants.tenants) {
            throw new Error("Invalid payload structure");
        }

        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        for (let i = 0; i < limit && i < tenants.tenants.length; i++) {
            const tenant = tenants.tenants[i];

            console.log("Processing tenant:", tenant);

            try {
                const response = await axios.post(`${BASE_URL}/api/server/v1/tenants`, tenant, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: AUTHORIZATION
                    },
                    httpsAgent: agent
                });

                console.log(`Tenant created: ${tenant.domain} - Response:`, response.data);
            } catch (error) {
                console.error(
                    `Failed to create tenant ${tenant.domain}:`,
                    error.response ? error.response.data : error.message
                );
            }
        }
    } catch (error) {
        console.error(`Error reading the payload file: ${error.message}`);
    }
}

async function deleteTenants() {
    try {
        let response = null;

        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        try {
            response = await axios.get(`${BASE_URL}/api/server/v1/tenants?limit=50`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: AUTHORIZATION
                },
                httpsAgent: agent
            });
        } catch (error) {
            console.error("Failed to get tenants:", error.response ? error.response.data : error.message);
        }

        if (!response || !response.data.tenants) {
            throw new Error("Invalid payload structure");
        }

        for (const tenant of response.data.tenants) {
            console.log("Processing tenant:", tenant);

            try {
                const response = await axios.delete(
                    `${BASE_URL}/api/server/v1/tenants/${tenant.id}/metadata`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: AUTHORIZATION
                        },
                        httpsAgent: agent
                    }
                );

                console.log(`Tenant deleted: ${tenant.domain} - Response:`, response.data);
            } catch (error) {
                console.error(
                    `Failed to delete tenant ${tenant.domain}:`,
                    error.response ? error.response.data : error.message
                );
            }
        }
    } catch (error) {
        console.error(`Error reading the payload file: ${error.message}`);
    }
}

const args = process.argv.slice(2);
const operation = args[0] || "create";
const limit = parseInt(args[1], 10) || 18;

if (operation === "create") {
    createTenants(limit);
} else if (operation === "delete") {
    deleteTenants();
} else {
    console.error("Invalid operation. Use 'create' or 'delete'.");
}
