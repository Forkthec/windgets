FROM ubuntu:24.04
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y curl build-essential pkg-config libssl-dev \
    libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev libsoup-3.0-dev && rm -rf /var/lib/apt/lists/*
ENV RUSTUP_HOME=/opt/rustup CARGO_HOME=/opt/cargo PATH=/opt/cargo/bin:$PATH
RUN curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain 1.91.1 -c rustfmt -c clippy
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y xz-utils git rsync jq postgresql-client && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://nodejs.org/dist/v22.22.0/node-v22.22.0-linux-x64.tar.xz | tar -xJ -C /opt && ln -s /opt/node-v22.22.0-linux-x64 /opt/node
ENV PATH=/opt/node/bin:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
# Comprobación cruzada del código Win32 (paso «windows» de verificar.sh): clippy para x86_64-pc-windows-msvc,
# sin enlazar. tauri-winres necesita llvm-rc para compilar los recursos del ejecutable.
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y llvm && rm -rf /var/lib/apt/lists/* \
    && rustup target add x86_64-pc-windows-msvc
