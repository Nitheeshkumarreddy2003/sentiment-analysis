import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("sentix.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    sentiment TEXT,
    intensity REAL,
    toxicity REAL,
    is_sarcastic BOOLEAN,
    is_urgent BOOLEAN,
    is_spam BOOLEAN,
    spam_score REAL,
    polarization_score REAL,
    topic TEXT,
    explanation TEXT,
    actionable_insight TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration: Add new columns if they don't exist
const columns = db.prepare("PRAGMA table_info(comments)").all();
const columnNames = columns.map((c: any) => c.name);

const newColumns = [
  { name: 'language', type: 'TEXT' },
  { name: 'confidence', type: 'REAL' },
  { name: 'entities', type: 'TEXT' },
  { name: 'translated_text', type: 'TEXT' },
  { name: 'is_spam', type: 'BOOLEAN' },
  { name: 'spam_score', type: 'REAL' },
  { name: 'polarization_score', type: 'REAL' },
  { name: 'actionable_insight', type: 'TEXT' },
  { name: 'parent_id', type: 'INTEGER' },
  { name: 'file_url', type: 'TEXT' },
  { name: 'file_name', type: 'TEXT' },
  { name: 'file_type', type: 'TEXT' },
  { name: 'file_analysis', type: 'TEXT' }
];

for (const col of newColumns) {
  if (!columnNames.includes(col.name)) {
    db.exec(`ALTER TABLE comments ADD COLUMN ${col.name} ${col.type}`);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes with error handling
  app.get("/api/comments", (req, res) => {
    try {
      const comments = db.prepare("SELECT * FROM comments ORDER BY timestamp DESC").all();
      const parsedComments = comments.map((c: any) => ({
        ...c,
        entities: JSON.parse(c.entities || "[]"),
        is_sarcastic: !!c.is_sarcastic,
        is_urgent: !!c.is_urgent,
        is_spam: !!c.is_spam
      }));
      res.json(parsedComments);
    } catch (error: any) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/comments", (req, res) => {
    try {
      const { 
        text, sentiment, intensity, toxicity, is_sarcastic, is_urgent, 
        is_spam, spam_score, polarization_score, topic, explanation, 
        actionable_insight, language, confidence, entities, translated_text,
        parent_id, file_url, file_name, file_type, file_analysis
      } = req.body;
      
      const info = db.prepare(`
        INSERT INTO comments (
          text, sentiment, intensity, toxicity, is_sarcastic, is_urgent, 
          is_spam, spam_score, polarization_score, topic, explanation, 
          actionable_insight, language, confidence, entities, translated_text,
          parent_id, file_url, file_name, file_type, file_analysis
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        text, sentiment, intensity, toxicity, 
        is_sarcastic ? 1 : 0, is_urgent ? 1 : 0, is_spam ? 1 : 0,
        spam_score, polarization_score, topic, explanation, 
        actionable_insight, language, confidence, JSON.stringify(entities), translated_text,
        parent_id || null, file_url || null, file_name || null, file_type || null, file_analysis || null
      );
      
      res.json({ id: info.lastInsertRowid });
    } catch (error: any) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/comments/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const allowedFields = [
        'sentiment', 'intensity', 'toxicity', 'is_sarcastic', 'is_urgent', 
        'is_spam', 'spam_score', 'polarization_score', 'topic', 'explanation', 
        'actionable_insight', 'language', 'confidence', 'entities', 'translated_text',
        'file_analysis'
      ];

      const setClause = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .map(key => `${key} = ?`)
        .join(", ");

      if (!setClause) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const values = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .map(key => key === 'entities' ? JSON.stringify(updates[key]) : updates[key]);

      db.prepare(`UPDATE comments SET ${setClause} WHERE id = ?`).run(...values, id);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating comment:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/comments/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.prepare("DELETE FROM comments WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stats", (req, res) => {
    try {
      const stats = {
        total: db.prepare("SELECT COUNT(*) as count FROM comments").get().count,
        sentiment_dist: db.prepare("SELECT sentiment, COUNT(*) as count FROM comments GROUP BY sentiment").all(),
        topic_dist: db.prepare("SELECT topic, COUNT(*) as count FROM comments GROUP BY topic").all(),
        urgency_count: db.prepare("SELECT COUNT(*) as count FROM comments WHERE is_urgent = 1").get().count,
        spam_count: db.prepare("SELECT COUNT(*) as count FROM comments WHERE is_spam = 1").get().count,
        avg_toxicity: db.prepare("SELECT AVG(toxicity) as avg FROM comments").get().avg || 0,
        avg_confidence: db.prepare("SELECT AVG(confidence) as avg FROM comments").get().avg || 0,
        avg_polarization: db.prepare("SELECT AVG(polarization_score) as avg FROM comments").get().avg || 0,
        language_dist: db.prepare("SELECT language, COUNT(*) as count FROM comments GROUP BY language").all(),
        recent_trends: db.prepare(`
          SELECT strftime('%Y-%m-%d %H:00:00', timestamp) as hour, 
                 COUNT(*) as count,
                 AVG(polarization_score) as avg_polarization,
                 AVG(CASE 
                   WHEN sentiment = 'positive' THEN 1 
                   WHEN sentiment = 'negative' THEN -1 
                   WHEN sentiment = 'sarcastic' THEN -0.5
                   ELSE 0 
                 END) as sentiment_score
          FROM comments 
          GROUP BY hour 
          ORDER BY hour ASC 
          LIMIT 24
        `).all(),
        recommendations: [] as string[]
      };

      // Logic-based recommendations
      if (stats.avg_toxicity > 0.3) {
        stats.recommendations.push("High toxicity detected: Consider enabling stricter content moderation filters.");
      }
      if (stats.avg_polarization > 0.4) {
        stats.recommendations.push("Significant polarization observed: Review topics for potential controversial content.");
      }
      if (stats.urgency_count > 5) {
        stats.recommendations.push("High volume of urgent feedback: Prioritize customer support response for flagged records.");
      }
      
      const negativeCount = (stats.sentiment_dist.find(s => s.sentiment === 'negative')?.count || 0);
      if (negativeCount / stats.total > 0.2) {
        stats.recommendations.push("Negative sentiment exceeds 20%: Conduct a deep-dive into the 'Actionable Insights' of negative records.");
      }

      if (stats.recommendations.length === 0) {
        stats.recommendations.push("System stable: Continue monitoring real-time sentiment streams.");
        stats.recommendations.push("Maintain current engagement levels: Positive feedback is within expected parameters.");
      }

      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Sentix Intelligence Framework initialized on port ${PORT}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[SERVER] Database: ${path.resolve("sentix.db")}`);
  });
}

startServer().catch((err) => {
  console.error("[SERVER] FATAL ERROR DURING STARTUP:", err);
  process.exit(1);
});
