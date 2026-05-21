const axios = require("axios");

async function queryPrometheus(query) {
    const baseUrl =
        global.runtimePrometheusUrl ||
        process.env.PROMETHEUS_URL;

    if (!baseUrl) {
        throw new Error("Prometheus URL is not configured");
    }

    const response = await axios.get(
        `${baseUrl}/api/v1/query`,
        {
            params: { query },
        }
    );

    if (response.data.status !== "success") {
        throw new Error("Prometheus query failed");
    }

    return response.data.data.result;
}

module.exports = {
    queryPrometheus,
};