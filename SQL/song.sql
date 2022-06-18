-- DROP TABLE song;
-- CREATE TABLE song (
-- 	id SERIAL PRIMARY KEY,
-- 	title varchar(80),
-- 	author varchar(40),
-- 	capo int,
-- 	chords varchar(80),
-- 	createDate date,
-- 	moreInfo varchar(300) 
-- );

-- SELECT * FROM song;

-- Change Column Name
-- ALTER TABLE song RENAME more TO moreInfo; 

DELETE FROM song;
INSERT INTO song(title, author, capo, chords, createDate, moreInfo) VALUES -- 每列必须对应，哪怕是空
('In the Dark', 'Charlie Puth', 0, 'G Em Bm A D','2022-06-18', ''),
('All Falls Down', 'Alan Walker', 1, 'F G C Am','2022-06-18', ''),
('Somebody Told Me', 'Charlie Puth', 0, 'A B C#m','2022-06-18', 'C#m(4 Fret Down f)'),
('Left Right Left', 'Charlie Puth', 0, 'D E G D Em D A F# Bm G D A F# Bm G D','2022-06-18', ''),
('刘大哈与大先生', '刘心', 0, 'C Bm Am7 G','2022-06-18', ''),
('大碗宽面', '吴亦凡', 0, 'Am Dm7 G C','2022-06-18', ''),
('告白の夜', 'Ayasa绚沙', 0, 'G A Bm A G A Bm G A Bm A Em C','2022-06-18', ''),
('Give Love', 'Andy Grammer', 0, 'C Am G/F C','2022-06-18', ''),
('No Brainer', 'Justin Bieber', 0, 'F Am G','2022-06-18', 'Asus hit 3 fret, little F hit 3 fret,BigB fret1(ud) to 3(dd) to 4(d) to 6(ud) and 3(d) slide 6(d)'),
('B-e-a-utiful', 'Megan Nicole', 0, 'F C G Am F C G F C G/FFF','2022-06-18', ''),
('Slow It Down', 'Charlie Puth', 3, 'Am7 F','2022-06-18', 'Am7(2 string up)'),
('Strawberries & Cigarettes', 'Troye Sivan', 0, 'A E F#m D','2022-06-18', '3 string:--7--9--11--'),
('All About Us', 'He Is We', 9, 'G D Cadd9 D','2022-06-18', ''),
('Hung up', 'Hot Chelle Rae', 2, 'D A Bm Bm G A D','2022-06-18', ''),
('Song for You', 'Big Time Rush', 0, 'E  B  C#m  A','2022-06-18', ''),
('Shape of You', 'Ed Sheeran', 2, 'Bm7 Em G A','2022-06-18', ''),
('TiK ToK', 'KeSha', 3, 'G A BM7','2022-06-18', ''),
('Good Time', 'Owl City', 1, 'G D A Bm7','2022-06-18', ''),
('Numb', 'Linkin Park', 2, 'Em  C  G  D  or F0 F#m D A E','2022-06-18', ''),
('Say Something', 'A Great Big World', 2, 'Am F C Gsus4','2022-06-18', ''),
('Eenie Meenie', 'Justin Bieber', 1, 'Am F C G','2022-06-18', ''),
('Change the World', 'Westlife', 0, 'A E F#m E A E F#m E','2022-06-18', ''),
('If I Let You Go', 'Westlife', 3, 'Gx2 G Bm Am7 Dsus4 D C D B7 Em A F#m D E','2022-06-18', ''),
('Stay', 'Tonya Mitchell', 0, '','2022-06-18', '3 string:|-6-8-10-11-10-8-6-5--5-6-8-10-8-6-5-3-3-5-6-8-6-5-3-5-s-6-s-5-3-p-5-'),
('Such a Fool', 'George Nozuka', 0, 'D/Asus4 Cadd9 D D/G Gm/E','2022-06-18', ''),
('Pass Me By', 'R5', 1, 'D A Bm G','2022-06-18', ''),
('Whiskey and Morphine', 'Alexander Jean', 0, 'C B7 Em G','2022-06-18', ''),
('One Call Away', 'Charlie Puth', 1, 'C G AM F C G','2022-06-18', ''),
('Galway Girl', 'Ed Sheeran', 2, 'Em G D Cadd9','2022-06-18', ''),
('Closer', 'The Chainsmokers', 1, 'Cadd9 D Em7 D','2022-06-18', ''),
('Don’t Wanna Know', 'Maroon5', 0, 'G D Em','2022-06-18', 'Em(2 string, 1 fret)'),
('Hey Soul Sister', 'Train', 4, 'Cx2 Gx2 Amx2 Fx2 Cx2 Gx2 Amx2 Fx1 Gx1 Fx2 Gx1 CC GG','2022-06-18', ''),
('时光', '许巍', 3, 'C AM DM G','2022-06-18', ''),
('Burn Out', 'Plug In Stereo', 0, 'A D E','2022-06-18', '1st string -5-4-0- -5-4-0-5-s-7'),
('Need You Now', 'Lady Antebellum', 4, 'F AM F AM F C EM C EM F AM F AM G C G','2022-06-18', ''),
('Settle for Less', 'Before You Exit', 0, 'B Abm E F#','2022-06-18', ''),
('He Said', 'Group 1 Crew', 3, 'G EM7 D','2022-06-18', ''),
('You Don’t Know Me', 'Ofenbach', 7, 'C Em Am F','2022-06-18', ''),
('Pink Champagne', 'Nick Lopez', 0, 'G BM C','2022-06-18', '3rd fret p 5rd fret'),
('Sooner', 'Andrew Allen', 0, 'G Cadd9 Em7 Cadd9','2022-06-18', '3 string:2H4 2H4 0'),
('Just the Way You Are', 'Bruno Mars', 3, 'D Bm G','2022-06-18', 'quick strum'),
('Havana', 'Camila Cabello', 3, 'Em C','2022-06-18', '2fret:1 3 5string 1fret:4string'),
('Payphone', 'Maroon5', 4, 'Cadd7 G','2022-06-18', '4th string and 2nd fret D(no 1th string 2nd fret)'),
('Rains in LA', 'Scouting for Girls', 5, 'Em7 Am7 D G','2022-06-18', ''),
('Better Than A Hallelujah', 'Amy Grant', 0, 'G Em C','2022-06-18', ''),
('We Are Stars', 'Virginia To Vegas', 4, 'G Cadd9 Em7 Cadd9','2022-06-18', '');

