// Import required modules
import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

// Express setup
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Database connection pool (FROM TEMPLATE – CORRECT)
const pool = mysql.createPool({
  host: "y5s2h87f6ur56vae.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "x961annv2rwlrope",
  password: "yziygibqpk3q352o",
  database: "c5dhod81zi9fvecy",
  connectionLimit: 10,
  waitForConnections: true
});

// to test connection to DB
app.get("/dbTest", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT CURDATE()");
    res.send(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).send("Database error");
  }
});


// ROUTES

// HOME PAGE
app.get('/', async (req, res) => {
  try {
    const [sites] = await pool.query(
      'SELECT * FROM fe_comic_sites'
    );

    const [randomComicRows] = await pool.query(
      `SELECT c.*, s.comicSiteName
       FROM fe_comics c
       JOIN fe_comic_sites s ON c.comicSiteId = s.comicSiteId
       ORDER BY RAND()
       LIMIT 1`
    );

    res.render('index', {
      sites,
      randomComic: randomComicRows[0]
    });
  } 
  catch (err) {
    console.error(err);
    res.send('Error loading page');
  }
});

// RANDOM COMIC
app.post('/randomComic', (req, res) => {
  res.redirect('/');
});

// ADD COMIC PAGE
app.get('/addComic', async (req, res) => {
  try {
    const [sites] = await pool.query(
      'SELECT * FROM fe_comic_sites'
    );
    res.render('add-comic', { sites });
  } catch (err) {
    console.error(err);
    res.send('Error loading page');
  }
});

// ADD COMIC
app.post('/addComic', async (req, res) => {
  const { comicUrl, comicTitle, comicSiteId, comicDate } = req.body;

  try {
    await pool.query(
      `INSERT INTO fe_comics
       (comicUrl, comicTitle, comicSiteId, comicDate)
       VALUES (?, ?, ?, ?)`,
      [comicUrl, comicTitle, comicSiteId, comicDate]
    );

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.send('Error adding comic');
  }
});

// COMICS BY SITE
app.get('/comics/:siteId', async (req, res) => {
  const { siteId } = req.params;

  try {
    const [siteRows] = await pool.query(
      'SELECT * FROM fe_comic_sites WHERE comicSiteId = ?',
      [siteId]
    );

    const [comics] = await pool.query(
      'SELECT * FROM fe_comics WHERE comicSiteId = ?',
      [siteId]
    );

    res.render('comic-page', {
      site: siteRows[0],
      comics
    });
  } catch (err) {
    console.error(err);
    res.send('Error loading page');
  }
});

// VIEW COMMENTS
app.get('/comments/:comicId', async (req, res) => {
  const { comicId } = req.params;

  try {
    const [comicRows] = await pool.query(
      'SELECT * FROM fe_comics WHERE comicId = ?',
      [comicId]
    );

    const [comments] = await pool.query(
      'SELECT * FROM fe_comments WHERE comicId = ?',
      [comicId]
    );

    res.render('comment', {
      comic: comicRows[0],
      comments
    });
  } catch (err) {
    console.error(err);
    res.send('Error loading page');
  }
});

// ADD COMMENT PAGE
app.get('/addComment/:comicId', async (req, res) => {
  const { comicId } = req.params;

  try {
    const [comicRows] = await pool.query(
      'SELECT * FROM fe_comics WHERE comicId = ?',
      [comicId]
    );

    res.render('add-comment', { comic: comicRows[0] });
  } catch (err) {
    console.error(err);
    res.send('Error loading page');
  }
});

// ADD COMMENT
app.post('/addComment', async (req, res) => {
  const { author, email, comment, comicId, siteId } = req.body;

  try {
    await pool.query(
      `INSERT INTO fe_comments
       (author, email, comment, comicId)
       VALUES (?, ?, ?, ?)`,
      [author, email, comment, comicId]
    );

    res.redirect(`/comics/${siteId}`);
  } catch (err) {
    console.error(err);
    res.send('Error adding comment');
  }
});

// START SERVER
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
