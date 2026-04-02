// Debug script to test MoSPI API - try different approaches

// Approach 1: POST with JSON body
async function tryPost() {
  console.log("=== Approach 1: POST with JSON body ===");
  try {
    const response = await fetch("https://api.mospi.gov.in/publisher/api/fetchData", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        indicator_code: "1",
        use_of_energy_balance_code: "1",
        year: "2023-24",
        energy_commodities_code: "1",
        end_use_sector_code: "5",
        limit: "10",
        Format: "JSON"
      })
    });
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Body (first 300):", text.substring(0, 300));
  } catch (e) { console.error("Error:", e.message); }
}

// Approach 2: POST with form data
async function tryPostForm() {
  console.log("\n=== Approach 2: POST with form-urlencoded ===");
  try {
    const params = new URLSearchParams({
      indicator_code: "1",
      use_of_energy_balance_code: "1",
      year: "2023-24",
      energy_commodities_code: "1",
      end_use_sector_code: "5",
      limit: "10",
      Format: "JSON"
    });
    const response = await fetch("https://api.mospi.gov.in/publisher/api/fetchData", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Body (first 300):", text.substring(0, 300));
  } catch (e) { console.error("Error:", e.message); }
}

// Approach 3: GET with different base URL patterns
async function tryAlternateURLs() {
  console.log("\n=== Approach 3: Alternate URL patterns ===");
  const urls = [
    "https://api.mospi.gov.in/publisher/fetchData",
    "https://api.mospi.gov.in/api/fetchData",
    "https://esankhyiki.mospi.gov.in/api/fetchData",
  ];
  for (const base of urls) {
    const url = `${base}?indicator_code=1&use_of_energy_balance_code=1&year=2023-24&energy_commodities_code=1&end_use_sector_code=5&limit=10&Format=JSON`;
    try {
      const response = await fetch(url, { headers: { "Accept": "application/json" } });
      console.log(`${base} => Status: ${response.status}`);
      const text = await response.text();
      const isJson = text.trim().startsWith("{") || text.trim().startsWith("[");
      console.log(`  JSON: ${isJson}, first 200: ${text.substring(0, 200)}`);
    } catch (e) { console.log(`${base} => Error: ${e.message}`); }
  }
}

// Approach 4: Use the eSankhyiki portal URL
async function tryESankhyiki() {
  console.log("\n=== Approach 4: eSankhyiki portal ===");
  const urls = [
    "https://esankhyiki.mospi.gov.in/publisher/api/fetchData",
    "https://esankhyiki.mospi.gov.in/publisher/fetchData",
  ];
  for (const base of urls) {
    const url = `${base}?indicator_code=1&use_of_energy_balance_code=1&year=2023-24&energy_commodities_code=1&end_use_sector_code=5&limit=10&Format=JSON`;
    try {
      const response = await fetch(url, { headers: { "Accept": "application/json" } });
      console.log(`${base} => Status: ${response.status}`);
      const text = await response.text();
      const isJson = text.trim().startsWith("{") || text.trim().startsWith("[");
      console.log(`  JSON: ${isJson}, first 200: ${text.substring(0, 200)}`);
    } catch (e) { console.log(`${base} => Error: ${e.message}`); }
  }
}

await tryPost();
await tryPostForm();
await tryAlternateURLs();
await tryESankhyiki();
