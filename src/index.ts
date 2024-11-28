import { Client } from "@elastic/elasticsearch";
import cors from "cors";
import express, { Request, Response } from "express";

const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// Initialize Elasticsearch client
const esClient = new Client({
  node: "http://127.0.0.1:9200", // Elasticsearch instance
});

// API to Get Jobs Not Applied To
app.get("/jobs/not-applied", async (req: Request, res: Response) => {
  try {
    const result = await esClient.search({
      index: "jobs",
      query: {
        term: {
          applied: false, // Fetch jobs where applied is false
        },
      },
    });

    // Return the search results
    res.status(200).json({
      // @ts-ignore
      total: result.hits.total.value,
      jobs: result.hits.hits.map((hit: any) => hit._source),
    });
  } catch (error) {
    console.error("Error fetching jobs not applied to:", error);
    res.status(500).json({ error: "Failed to fetch jobs not applied to." });
  }
});

// @ts-ignore
app.get("/jobs/search", async (req: Request, res: Response) => {
  const { keyword } = req.query;

  if (!keyword || typeof keyword !== "string") {
    return res
      .status(400)
      .json({
        error: "Keyword query parameter is required and must be a string.",
      });
  }

  try {
    const result = await esClient.search({
      index: "jobs",
      query: {
        bool: {
          should: [
            { wildcard: { title: `*${keyword}*` } },
            { wildcard: { description: `*${keyword}*` } },
            { wildcard: { skills: `*${keyword}*` } },
            { wildcard: { source: `*${keyword}*` } },
            // { wildcard: { location: `*${keyword}*` } },
          ],
        },
      },
    });

    res.status(200).json({
      // @ts-ignore
      total: result.hits.total.value,
      jobs: result.hits.hits.map((hit: any) => hit._source),
    });
  } catch (error) {
    console.error("Error searching jobs by keyword:", error);
    res.status(500).json({ error: "Failed to search jobs by keyword." });
  }
});

// Start server
app.listen(3000, () => {
  console.log("App listening on port 3000");
});
