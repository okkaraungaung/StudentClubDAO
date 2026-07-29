/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: false },
      { source: "/register.html", destination: "/register", permanent: false },
      { source: "/dashboard.html", destination: "/dashboard", permanent: false },
      { source: "/proposals.html", destination: "/proposals", permanent: false },
      { source: "/fees.html", destination: "/fees", permanent: false },
      { source: "/admin.html", destination: "/admin", permanent: false },
    ];
  },
};

module.exports = nextConfig;
