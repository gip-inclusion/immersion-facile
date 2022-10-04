import tracer from "dd-trace";
tracer.init({ env: process.env.ENV_TYPE });
