# TypeSpec AsyncAPI Installation Guide

**Complete step-by-step installation guide for all environments**

---

## 📋 Quick Installation (Recommended)

### Prerequisites Check

```bash
# Verify Node.js version (required: >=20.0.0)
node --version  # Should show v20.x.x or higher

# Verify package manager
bun --version   # Recommended: >=1.0.0
# OR
npm --version   # Alternative: >=9.0.0
```

### Install TypeSpec AsyncAPI Emitter

```bash
# Using Bun (recommended - faster)
bun add @larsartmann/typespec-asyncapi

# Using npm
bun add @larsartmann/typespec-asyncapi

# Install TypeSpec compiler if not already installed
bun add -D @typespec/compiler
# OR
bun add -D @typespec/compiler
```

### Verify Installation

```bash
# Check TypeSpec compiler
bunx tsp --version

# Verify emitter installation
bunx tsp compile --help | grep asyncapi
```

---

## 🚀 Environment-Specific Installation

### 🖥️ Windows Installation

#### Using PowerShell (Recommended)

```powershell
# 1. Install Node.js (if not installed)
# Download from: https://nodejs.org/en/download/

# 2. Install Bun (recommended)
powershell -c "irm bun.sh/install.ps1 | iex"

# 3. Refresh PATH
refreshenv

# 4. Install TypeSpec AsyncAPI
bun add @larsartmann/typespec-asyncapi
bun add -D @typespec/compiler

# 5. Verify installation
bunx tsp --version
```

#### Using CMD

```cmd
REM 1. Install Node.js first (nodejs.org)
REM 2. Install using npm
bun add -g @typespec/compiler
bun add @larsartmann/typespec-asyncapi

REM 3. Verify
bunx tsp --version
```

#### Windows Subsystem for Linux (WSL)

```bash
# Use Linux installation instructions below
```

### 🐧 Linux Installation

#### Ubuntu/Debian

```bash
# 1. Update system
sudo apt update

# 2. Install Node.js 20+ (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# 4. Install TypeSpec AsyncAPI
bun add @larsartmann/typespec-asyncapi
bun add -D @typespec/compiler

# 5. Verify installation
bunx tsp --version
bun --version
```

#### CentOS/RHEL/Fedora

```bash
# 1. Install Node.js 20+
sudo dnf install nodejs npm

# OR using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# 2. Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# 3. Install TypeSpec AsyncAPI
bun add @larsartmann/typespec-asyncapi
bun add -D @typespec/compiler

# 4. Verify
node --version
bun --version
bunx tsp --version
```

#### Alpine Linux (Docker)

```bash
# 1. Install Node.js and npm
apk add --no-cache nodejs npm

# 2. Install TypeSpec AsyncAPI
bun add -g @typespec/compiler
bun add @larsartmann/typespec-asyncapi

# 3. Verify
bunx tsp --version
```

### 🍎 macOS Installation

#### Using Homebrew (Recommended)

```bash
# 1. Install Node.js
brew install node

# 2. Install Bun
brew tap oven-sh/bun
brew install bun

# 3. Install TypeSpec AsyncAPI
bun add @larsartmann/typespec-asyncapi
bun add -D @typespec/compiler

# 4. Verify installation
node --version
bun --version
bunx tsp --version
```

#### Using MacPorts

```bash
# 1. Install Node.js
sudo port install nodejs20

# 2. Install Bun manually
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# 3. Install TypeSpec AsyncAPI
bun add @larsartmann/typespec-asyncapi
bun add -D @typespec/compiler
```

#### Using Direct Download

```bash
# 1. Download and install Node.js from nodejs.org
# 2. Install Bun
curl -fsSL https://bun.sh/install | bash

# 3. Install TypeSpec AsyncAPI
bun add @larsartmann/typespec-asyncapi
bun add -D @typespec/compiler
```

---

## 🐳 Docker Installation

### Official Docker Image

```dockerfile
# Use the official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install Bun
RUN bun add -g bun

# Install TypeSpec compiler and AsyncAPI emitter
RUN bun add -g @typespec/compiler
RUN bun add @larsartmann/typespec-asyncapi

# Copy your TypeSpec files
COPY . .

# Verify installation
RUN bunx tsp --version

# Default command
CMD ["bunx", "tsp", "compile", "."]
```

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'
services:
  typespec-asyncapi:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    working_dir: /app
    command: bunx tsp compile . --emit @larsartmann/typespec-asyncapi

volumes:
  node_modules:
```

### Run with Docker

```bash
# Build and run
docker-compose up --build

# OR using Docker directly
docker run -v $(pwd):/app -w /app node:20-alpine sh -c "
  bun add -g bun @typespec/compiler &&
  bun add @larsartmann/typespec-asyncapi &&
  bunx tsp compile . --emit @larsartmann/typespec-asyncapi
"
```

---

## 🏢 CI/CD Installation

### GitHub Actions

```yaml
# .github/workflows/typespec-build.yml
name: TypeSpec Build
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: |
          bun install
          bun add -D @typespec/compiler

      - name: Install TypeSpec AsyncAPI
        run: bun add @larsartmann/typespec-asyncapi

      - name: Verify installation
        run: bunx tsp --version

      - name: Compile TypeSpec
        run: bunx tsp compile . --emit @larsartmann/typespec-asyncapi

      - name: Validate AsyncAPI output
        run: |
          bun add -g @asyncapi/cli
          asyncapi validate tsp-output/**/*.json
```

### GitLab CI

```yaml
# .gitlab-ci.yml
image: node:20-alpine

before_script:
  - bun add -g bun
  - bun --version

stages:
  - install
  - build
  - validate

install:
  stage: install
  script:
    - bun install
    - bun add -D @typespec/compiler
    - bun add @larsartmann/typespec-asyncapi
  cache:
    paths:
      - node_modules/

build:
  stage: build
  script:
    - bunx tsp compile . --emit @larsartmann/typespec-asyncapi
  artifacts:
    paths:
      - tsp-output/

validate:
  stage: validate
  script:
    - bun add -g @asyncapi/cli
    - asyncapi validate tsp-output/**/*.json
```

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any

    tools {
        nodejs '20'
    }

    stages {
        stage('Setup') {
            steps {
                sh 'bun add -g bun'
                sh 'bun --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'bun install'
                sh 'bun add -D @typespec/compiler'
                sh 'bun add @larsartmann/typespec-asyncapi'
            }
        }

        stage('Verify Installation') {
            steps {
                sh 'bunx tsp --version'
            }
        }

        stage('Build') {
            steps {
                sh 'bunx tsp compile . --emit @larsartmann/typespec-asyncapi'
            }
        }

        stage('Validate') {
            steps {
                sh 'bun add -g @asyncapi/cli'
                sh 'asyncapi validate tsp-output/**/*.json'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'tsp-output/**/*', allowEmptyArchive: true
        }
    }
}
```

---

## 🔧 Advanced Installation Options

### Development Installation

```bash
# Clone the repository for development
git clone https://github.com/LarsArtmann/typespec-asyncapi.git
cd typespec-asyncapi

# Install development dependencies
bun install

# Build from source
bun run build

# Link for local development
bun link

# In your project
bun link @larsartmann/typespec-asyncapi
```

### Global Installation

```bash
# Install TypeSpec compiler globally
bun add -g @typespec/compiler

# Install emitter globally (not recommended for production)
bun add -g @larsartmann/typespec-asyncapi

# Verify global installation
tsp --version
```

### Specific Version Installation

```bash
# Install specific version
bun add @larsartmann/typespec-asyncapi@0.1.0-alpha

# Install pre-release version
bun add @larsartmann/typespec-asyncapi@beta

# Check available versions
npm view @larsartmann/typespec-asyncapi versions --json
```

---

## ✅ Installation Verification

### Basic Verification

```bash
# 1. Check Node.js version
node --version
# Expected: v20.0.0 or higher

# 2. Check package manager
bun --version
# Expected: 1.0.0 or higher

# 3. Check TypeSpec compiler
bunx tsp --version
# Expected: TypeSpec compiler version info

# 4. Check emitter availability
bunx tsp compile --help | grep asyncapi
# Expected: @larsartmann/typespec-asyncapi in emitter list

# 5. List installed packages
bun list | grep typespec
# Expected: @typespec/compiler and @larsartmann/typespec-asyncapi
```

### Comprehensive Verification

```bash
# Create test TypeSpec file
cat > test.tsp << 'EOF'
import "@larsartmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@server("production", {
  url: "kafka://localhost:9092",
  protocol: "kafka"
})
namespace TestNamespace;

model TestMessage {
  id: string;
  message: string;
}

@channel("test.channel")
@publish
op publishTest(): TestMessage;
EOF

# Compile test file
bunx tsp compile test.tsp --emit @larsartmann/typespec-asyncapi

# Verify output
ls tsp-output/@larsartmann/typespec-asyncapi/
# Expected: asyncapi.json or asyncapi.yaml

# Validate generated AsyncAPI
bun add -g @asyncapi/cli
asyncapi validate tsp-output/@larsartmann/typespec-asyncapi/asyncapi.json

# Clean up
rm test.tsp
rm -rf tsp-output
```

---

## 🚨 Troubleshooting Common Issues

### Node.js Version Issues

```bash
# Problem: Node.js version too old
node --version  # Shows v18.x or lower

# Solution 1: Update Node.js
# Download from nodejs.org

# Solution 2: Use Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### Permission Issues (Linux/macOS)

```bash
# Problem: EACCES errors during installation

# Solution 1: Use bun instead of npm
bun add @larsartmann/typespec-asyncapi

# Solution 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Windows PATH Issues

```powershell
# Problem: 'bunx' or 'tsp' not found

# Solution: Add Node.js and npm to PATH
$env:PATH += ";C:\Program Files\nodejs"
refreshenv

# Verify
bunx --version
```

### TypeSpec Compiler Not Found

```bash
# Problem: Cannot find module '@typespec/compiler'

# Solution: Install compiler explicitly
bun add -D @typespec/compiler

# Verify installation
bunx tsp --version
```

### Emitter Not Found

```bash
# Problem: Unknown emitter "@larsartmann/typespec-asyncapi"

# Solution 1: Verify installation
bun list | grep typespec-asyncapi

# Solution 2: Reinstall
bun remove @larsartmann/typespec-asyncapi
bun add @larsartmann/typespec-asyncapi

# Solution 3: Check package.json
cat package.json | grep typespec-asyncapi
```

### Memory Issues During Installation

```bash
# Problem: JavaScript heap out of memory

# Solution: Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
bun add @larsartmann/typespec-asyncapi

# For Windows PowerShell
$env:NODE_OPTIONS = "--max-old-space-size=4096"
```

### Corporate Firewall Issues

```bash
# Problem: Cannot download packages

# Solution 1: Configure npm registry
npm config set registry https://registry.npmjs.org/

# Solution 2: Configure proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Solution 3: Use alternative registry
npm config set registry https://registry.yarnpkg.com/
```

---

## 📞 Getting Help

### Documentation

- **GitHub Repository**: https://github.com/LarsArtmann/typespec-asyncapi
- **API Documentation**: [Generated TypeDoc](./api/index.html)
- **Examples**: [Example Projects](../examples/)

### Community Support

- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Community Q&A and discussions
- **TypeSpec Discord**: #asyncapi channel

### Professional Support

- **Enterprise Support**: Available for production deployments
- **Custom Development**: Plugin development and customization
- **Training**: TypeSpec and AsyncAPI training programs

---

## 🎯 Next Steps

After successful installation:

1. **Follow the Quick Start Guide**: [Getting Started](./getting-started.md)
2. **Explore Examples**: [Example Projects](../examples/)
3. **Learn Decorators**: [Decorator Reference](./decorators.md)
4. **Join the Community**: [Contributing Guide](../CONTRIBUTING.md)

---

_Installation Guide Last Updated: September 2, 2025_  
_For the latest installation instructions, visit: https://github.com/LarsArtmann/typespec-asyncapi_
