// Production server for A2 Hosting (cPanel Node.js App)
process.env.PORT = process.env.PORT || "3000";
process.env.HOSTNAME = "0.0.0.0";

require("./.next/standalone/server.js");
