// Import required modules
import express from 'express';
import mysql from 'mysql';

const app = express();

// Set up Express
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'comics_db'
});

// Connect to database
connection.connect(function(err) {
  if (err) {
    console.error('Error connecting to database: ' + err.stack);
    return;
  }
  console.log('Connected to database');
});

// HOME PAGE - Display all comic sites and random comic
app.get('/', function(req, res) {
  // Get all comic sites
  const sqlSites = 'SELECT * FROM fe_comic_sites';
  
  connection.query(sqlSites, function(err, sites) {
    if (err) {
      console.error('Error fetching sites: ' + err);
      res.send('Error loading page');
      return;
    }
    
    // Get a random comic
    const sqlRandomComic = 'SELECT c.*, s.comicSiteName FROM fe_comics c JOIN fe_comic_sites s ON c.comicSiteId = s.comicSiteId ORDER BY RAND() LIMIT 1';
    
    connection.query(sqlRandomComic, function(err, randomComic) {
      if (err) {
        console.error('Error fetching random comic: ' + err);
        res.send('Error loading page');
        return;
      }
      
      res.render('index', { 
        sites: sites, 
        randomComic: randomComic[0] 
      });
    });
  });
});

// DISPLAY RANDOM COMIC - Reload page with new random comic
app.post('/randomComic', function(req, res) {
  res.redirect('/');
});

// ADD COMIC PAGE - Display form to add new comic
app.get('/addComic', function(req, res) {
  // Get all comic sites for dropdown
  const sqlSites = 'SELECT * FROM fe_comic_sites';
  
  connection.query(sqlSites, function(err, sites) {
    if (err) {
      console.error('Error fetching sites: ' + err);
      res.send('Error loading page');
      return;
    }
    
    res.render('add-comic', { sites: sites });
  });
});

// ADD COMIC - Process form submission
app.post('/addComic', function(req, res) {
  // Get form data
  const comicUrl = req.body.comicUrl;
  const comicTitle = req.body.comicTitle;
  const comicSiteId = req.body.comicSiteId;
  const comicDate = req.body.comicDate;
  
  // Insert into database
  const sql = 'INSERT INTO fe_comics (comicUrl, comicTitle, comicSiteId, comicDate) VALUES (?, ?, ?, ?)';
  const values = [comicUrl, comicTitle, comicSiteId, comicDate];
  
  connection.query(sql, values, function(err, result) {
    if (err) {
      console.error('Error adding comic: ' + err);
      res.send('Error adding comic');
      return;
    }
    
    // Redirect back to home page
    res.redirect('/');
  });
});

// COMIC PAGE - Display all comics for a specific site
app.get('/comics/:siteId', function(req, res) {
  const siteId = req.params.siteId;
  
  // Get comic site info
  const sqlSite = 'SELECT * FROM fe_comic_sites WHERE comicSiteId = ?';
  
  connection.query(sqlSite, [siteId], function(err, site) {
    if (err) {
      console.error('Error fetching site: ' + err);
      res.send('Error loading page');
      return;
    }
    
    // Get all comics for this site
    const sqlComics = 'SELECT * FROM fe_comics WHERE comicSiteId = ?';
    
    connection.query(sqlComics, [siteId], function(err, comics) {
      if (err) {
        console.error('Error fetching comics: ' + err);
        res.send('Error loading page');
        return;
      }
      
      res.render('comic-page', { 
        site: site[0], 
        comics: comics 
      });
    });
  });
});

// VIEW COMMENTS PAGE - Display all comments for a specific comic
app.get('/comments/:comicId', function(req, res) {
  const comicId = req.params.comicId;
  
  // Get comic info
  const sqlComic = 'SELECT * FROM fe_comics WHERE comicId = ?';
  
  connection.query(sqlComic, [comicId], function(err, comic) {
    if (err) {
      console.error('Error fetching comic: ' + err);
      res.send('Error loading page');
      return;
    }
    
    // Get all comments for this comic
    const sqlComments = 'SELECT * FROM fe_comments WHERE comicId = ?';
    
    connection.query(sqlComments, [comicId], function(err, comments) {
      if (err) {
        console.error('Error fetching comments: ' + err);
        res.send('Error loading page');
        return;
      }
      
      res.render('comment', { 
        comic: comic[0], 
        comments: comments 
      });
    });
  });
});

// ADD COMMENT PAGE - Display form to add comment
app.get('/addComment/:comicId', function(req, res) {
  const comicId = req.params.comicId;
  
  // Get comic info
  const sql = 'SELECT * FROM fe_comics WHERE comicId = ?';
  
  connection.query(sql, [comicId], function(err, comic) {
    if (err) {
      console.error('Error fetching comic: ' + err);
      res.send('Error loading page');
      return;
    }
    
    res.render('add-comment', { comic: comic[0] });
  });
});

// ADD COMMENT - Process form submission
app.post('/addComment', function(req, res) {
  // Get form data
  const author = req.body.author;
  const email = req.body.email;
  const comment = req.body.comment;
  const comicId = req.body.comicId;
  
  // Insert into database
  const sql = 'INSERT INTO fe_comments (author, email, comment, comicId) VALUES (?, ?, ?, ?)';
  const values = [author, email, comment, comicId];
  
  connection.query(sql, values, function(err, result) {
    if (err) {
      console.error('Error adding comment: ' + err);
      res.send('Error adding comment');
      return;
    }
    
    // Redirect back to comic page
    res.redirect('/comics/' + req.body.siteId);
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, function() {
  console.log('Server running on port ' + PORT);
});
