require("dotenv").config(); // Cargar variables de entorno desde .env

const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

// Inicializar Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Convertir \n a saltos de línea
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  }),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
});

const db = admin.firestore();

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors({ origin: true })); // Asegúrate de que CORS permita peticiones desde cualquier origen

console.log("Iniciando servidor...");

// Middleware para servir archivos estáticos (frontend)
app.use(express.static("public"));

// Ruta principal
app.get("/test", (req, res) => {
  res.send("¡Hola desde el servidor Express!");
});

// Ruta para crear una nueva nota
app.post("/guardar-nota", async (req, res) => {
  try {
    const { titulo, contenido } = req.body;

    if (!titulo || !contenido) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const nuevaNota = {
      titulo,
      contenido,
      fecha: admin.firestore.Timestamp.now(), // Usar Timestamp de Firestore
    };

    const docRef = await db.collection("notas").add(nuevaNota);

    res.status(201).json({ id: docRef.id, ...nuevaNota });
  } catch (error) {
    console.error("Error al guardar la nota:", error);
    res.status(500).json({ error: "Error al guardar la nota" });
  }
});

// Ruta para obtener las notas guardadas
app.get("/notas", async (_req, res) => {
  try {
    const snapshot = await db.collection("notas").orderBy("fecha", "desc").get();
    const notas = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(notas);
  } catch (error) {
    console.error("Error al obtener las notas:", error);
    res.status(500).json({ error: "Error al obtener las notas" });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
console.log("Conexión a Firebase exitosa!");