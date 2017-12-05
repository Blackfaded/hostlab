const router = require('express').Router();

const deleteUser = require('../tasks/deleteUser');
const User = require('../databases/mongodb/models/user');

router.get('/', (req, res, next) => {
  res.render('settings', {
    feedback: req.flash('feedback'),
    success: req.flash('success') || false,
  });
});

router.post('/password', (req, res, next) => {
      const oldPassword = req.body.oldPassword;
      const newPassword = req.body.newPassword;
      const newPasswordConfirm = req.body.newPasswordConfirm;

      // Serverseitiger Check, ob die neuen Passwörter übereinstimmen
      if (newPassword === newPasswordConfirm) {
        User.findOne({'username': req.user.username}, function(err, user) {
          if (err) {
            console.error(err);
          }

          // Kein Nutzer existiert
          else if (!user) {
            req.flash('feedback', 'No user found.');
            res.redirect('/settings');
          }

          // Nutzer ist nicht Localuser (er darf sein PW also nicht ändern)
          else if (user.isLdapUser) {
            req.flash('feedback',
                'Only local users can change their password here.');
            res.redirect('/settings');
          }
          // Passwortänderung nur, wenn altes Passwort korrekt war
          else {
            user.validPassword(oldPassword, function(err, response) {
              if (err) {
                console.error(err);
                req.flash('feedback', 'Error on updating your password.');
                res.redirect('/settings');
              }
              // altes Passwort war falsch
              else if (response === false) {
                req.flash('feedback', 'Old password did not match.');
                res.redirect('/settings');
              }
              else {
                // Neues Passwort gehasht abspeichern
                user.generateHash(newPassword, (err, hash) => {
                  if (err) {
                    console.error(err);
                    req.flash('feedback', 'Error on updating your password.');
                    res.redirect('/settings');
                  }
                  else {
                    user.password = hash;

                    user.save((err) => {
                      if (err) {
                        req.flash('feedback', 'Error on updating your password.');
                        res.redirect('/settings');
                      }

                      // Antwort bei erfolgreicher Änderung
                      else {
                        req.flash('success', true);
                        req.flash('feedback', 'Password changed successfully.');
                        res.redirect('/settings');
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
      // Neue Passwörter stimmen nicht überein
      else {
        req.flash('feedback', 'New passwords did not match.');
        res.redirect('/settings');
      }
    },
);

router.delete('/account', (req, res, next) => {

  // Man darf seinen Account nur dann löschen, wenn man kein Admin ist
  if (!req.user.isAdmin) {

    deleteUser({username: req.user.username}, (err) => {
      if (err) {
        console.error(err);
        // Servererror
        res.sendStatus(500);
      }
      else {
        // ok
        res.sendStatus(200);
      }
    });
  }
  else {
    // forbidden
    res.sendStatus(403);
  }
});

module.exports = router;