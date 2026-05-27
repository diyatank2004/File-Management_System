import fs from 'fs';

async function testUpload() {
  try {
    console.log("Creating test user...");
    const email = `test${Date.now()}@gmail.com`;
    const password = "Password@123";
    
    let res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test User", email, password })
    });
    
    let data = await res.json();
    if (!res.ok) {
        console.log("Register failed:", data);
        res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@gmail.com", password: "Password@123" }) // fallback
        });
        data = await res.json();
    }
    
    const token = data.token;
    console.log("Token:", token ? "Got token" : "No token");

    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const body = `--${boundary}\r\n` +
                 `Content-Disposition: form-data; name="file"; filename="test.txt"\r\n` +
                 `Content-Type: text/plain\r\n\r\n` +
                 `Hello world\r\n` +
                 `--${boundary}--`;

    console.log("Uploading file...");
    const uploadRes = await fetch("http://localhost:5000/api/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });

    const uploadData = await uploadRes.json();
    console.log("Status:", uploadRes.status);
    console.log("Response:", uploadData);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testUpload();
