# Tenant Seeder Script

This script is used to create and delete tenants in a server. It reads tenant data from a JSON file and interacts with the server's API to perform the operations.

## Prerequisites

- Node.js (v12 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install the dependencies:
   ```sh
   npm install
   ```

3. Create environment variable files:
   - `.env.local`
   - `.env.development` or `.env.production`
   - `.env`

   Example content for `.env.local`:
   ```
   AUTHORIZATION=your_authorization_token
   ```

## Usage

### Create Tenants

To create tenants, run the script with the `create` operation (default) and specify the limit (optional, default is 18):

```sh
node seed-tenants.js create [limit]
```

Example:
```sh
node seed-tenants.js create 10
```

### Delete Tenants

To delete tenants, run the script with the `delete` operation:

```sh
node seed-tenants.js delete
```

## Environment Variables

The script uses environment variables to configure the authorization token and other settings. The environment variables are loaded from the following files in order:

1. `.env.local`
2. `.env.development` or `.env.production` (based on `NODE_ENV`)
3. `.env`

### Example `.env.local` File

```env
AUTHORIZATION=your_authorization_token
```

## How It Works

1. The script loads environment variables from the specified `.env` files.
2. It reads tenant data from a JSON file (`payloads.json`).
3. Based on the operation (`create` or `delete`), it interacts with the server's API to create or delete tenants.

### Code Excerpt

```jsx
const axios = require("axios");
const dotenv = require("dotenv");

// Load environment variables from .env files in the following order:
// .env.local, .env.development or .env.production, .env
const envFiles = [
    ".env.local",
    `.env.${process.env.NODE_ENV || "development"}`,
    ".env`
];

function loadEnvFiles(envFiles, maxLevels = 5) {
    for (const file of envFiles) {
        let currentDir = __dirname;
        for (let i = 0; i <= maxLevels; i++) {
            const envPath = path.resolve(currentDir, file);
            if (fs.existsSync(envPath)) {
                dotenv.config({ path: envPath });
                break;
            }
            currentDir = path.resolve(currentDir, "..");
        }
    }
}

loadEnvFiles(envFiles);

/**
 * Get the authorization token from environment variables.
 */
const AUTHORIZATION = process.env.AUTHORIZATION;
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
