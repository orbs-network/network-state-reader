const http = require('http');

function getStatusFailureJson(errorMessage) {
  const json = {
    Timestamp: new Date().toISOString(),
    Status: 'Failed retreiving /status HTTP endpoint.',
    Error: errorMessage,
  };
  return JSON.stringify(json, null, 2);
}

http.get('http://localhost:8080/status', (res) => {
  const { statusCode } = res;
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (statusCode == 200 && JSON.parse(data).Timestamp) {
      console.log(data);
      process.exit(0);
    }
    console.log(getStatusFailureJson(`HTTP code: ${statusCode}, response: '${data}'.`));
    process.exit(128);
  });

}).on('error', (err) => {
  console.log(getStatusFailureJson(err.message));
  process.exit(128);
});