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

-- ALTER TABLE song RENAME more TO moreInfo; -- Change Column Name

-- DELETE FROM song;
-- INSERT INTO song(title, author, capo, chords, createDate, moreInfo) VALUES -- 每列必须对应，哪怕是空
-- ('In the Dark', 'Charlie Puth', 0, 'G Em Bm A D','2022-06-18', ''),
-- ('All Falls Down', 'Alan Walker', 1, 'F G C Am','2022-06-18', ''),
-- ('Somebody Told Me', 'Charlie Puth', 0, 'A B C#m','2022-06-18', 'C#m(4 Fret Down f)'),
-- ('Left Right Left', 'Charlie Puth', 0, 'D E G D Em D A F# Bm G D A F# Bm G D','2022-06-18', ''),
-- ('刘大哈与大先生', '刘心', 0, 'C Bm Am7 G','2022-06-18', ''),
-- ('大碗宽面', '吴亦凡', 0, 'Am Dm7 G C','2022-06-18', ''),
-- ('告白の夜', 'Ayasa绚沙', 0, 'G A Bm A G A Bm G A Bm A Em C','2022-06-18', ''),
-- ('Give Love', 'Andy Grammer', 0, 'C Am G/F C','2022-06-18', ''),
-- ('No Brainer', 'Justin Bieber', 0, 'F Am G','2022-06-18', 'Asus hit 3 fret, little F hit 3 fret,BigB fret1(ud) to 3(dd) to 4(d) to 6(ud) and 3(d) slide 6(d)'),
-- ('B-e-a-utiful', 'Megan Nicole', 0, 'F C G Am F C G F C G/FFF','2022-06-18', ''),
-- ('Slow It Down', 'Charlie Puth', 3, 'Am7 F','2022-06-18', 'Am7(2 string up)'),
-- ('Strawberries & Cigarettes', 'Troye Sivan', 0, 'A E F#m D','2022-06-18', '3 string:--7--9--11--'),
-- ('All About Us', 'He Is We', 9, 'G D Cadd9 D','2022-06-18', ''),
-- ('Hung up', 'Hot Chelle Rae', 2, 'D A Bm Bm G A D','2022-06-18', ''),
-- ('Song for You', 'Big Time Rush', 0, 'E  B  C#m  A','2022-06-18', ''),
-- ('Shape of You', 'Ed Sheeran', 2, 'Bm7 Em G A','2022-06-18', ''),
-- ('TiK ToK', 'KeSha', 3, 'G A BM7','2022-06-18', ''),
-- ('Good Time', 'Owl City', 1, 'G D A Bm7','2022-06-18', ''),
-- ('Numb', 'Linkin Park', 2, 'Em  C  G  D  or F0 F#m D A E','2022-06-18', ''),
-- ('Say Something', 'A Great Big World', 2, 'Am F C Gsus4','2022-06-18', ''),
-- ('Eenie Meenie', 'Justin Bieber', 1, 'Am F C G','2022-06-18', ''),
-- ('Change the World', 'Westlife', 0, 'A E F#m E A E F#m E','2022-06-18', ''),
-- ('If I Let You Go', 'Westlife', 3, 'Gx2 G Bm Am7 Dsus4 D C D B7 Em A F#m D E','2022-06-18', ''),
-- ('Stay', 'Tonya Mitchell', 0, '','2022-06-18', '3 string:|-6-8-10-11-10-8-6-5--5-6-8-10-8-6-5-3-3-5-6-8-6-5-3-5-s-6-s-5-3-p-5-'),
-- ('Such a Fool', 'George Nozuka', 0, 'D/Asus4 Cadd9 D D/G Gm/E','2022-06-18', ''),
-- ('Pass Me By', 'R5', 1, 'D A Bm G','2022-06-18', ''),
-- ('Whiskey and Morphine', 'Alexander Jean', 0, 'C B7 Em G','2022-06-18', ''),
-- ('One Call Away', 'Charlie Puth', 1, 'C G AM F C G','2022-06-18', ''),
-- ('Galway Girl', 'Ed Sheeran', 2, 'Em G D Cadd9','2022-06-18', ''),
-- ('Closer', 'The Chainsmokers', 1, 'Cadd9 D Em7 D','2022-06-18', ''),
-- ('Don’t Wanna Know', 'Maroon5', 0, 'G D Em','2022-06-18', 'Em(2 string, 1 fret)'),
-- ('Hey Soul Sister', 'Train', 4, 'Cx2 Gx2 Amx2 Fx2 Cx2 Gx2 Amx2 Fx1 Gx1 Fx2 Gx1 CC GG','2022-06-18', ''),
-- ('时光', '许巍', 3, 'C AM DM G','2022-06-18', ''),
-- ('Burn Out', 'Plug In Stereo', 0, 'A D E','2022-06-18', '1st string -5-4-0- -5-4-0-5-s-7'),
-- ('Need You Now', 'Lady Antebellum', 4, 'F AM F AM F C EM C EM F AM F AM G C G','2022-06-18', ''),
-- ('Settle for Less', 'Before You Exit', 0, 'B Abm E F#','2022-06-18', ''),
-- ('He Said', 'Group 1 Crew', 3, 'G EM7 D','2022-06-18', ''),
-- ('You Don’t Know Me', 'Ofenbach', 7, 'C Em Am F','2022-06-18', ''),
-- ('Pink Champagne', 'Nick Lopez', 0, 'G BM C','2022-06-18', '3rd fret p 5rd fret'),
-- ('Sooner', 'Andrew Allen', 0, 'G Cadd9 Em7 Cadd9','2022-06-18', '3 string:2H4 2H4 0'),
-- ('Just the Way You Are', 'Bruno Mars', 3, 'D Bm G','2022-06-18', 'quick strum'),
-- ('Havana', 'Camila Cabello', 3, 'Em C','2022-06-18', '2fret:1 3 5string 1fret:4string'),
-- ('Payphone', 'Maroon5', 4, 'Cadd7 G','2022-06-18', '4th string and 2nd fret D(no 1th string 2nd fret)'),
-- ('Rains in LA', 'Scouting for Girls', 5, 'Em7 Am7 D G','2022-06-18', ''),
-- ('Better Than A Hallelujah', 'Amy Grant', 0, 'G Em C','2022-06-18', ''),
-- ('We Are Stars', 'Virginia To Vegas', 4, 'G Cadd9 Em7 Cadd9','2022-06-18', '');

-- CREATE TABLE songTab (
-- 	id SERIAL PRIMARY KEY,
-- 	title varchar(80),
-- 	author varchar(40),
-- 	minorEString varchar(200),
-- 	BString varchar(200),
-- 	GString varchar(200),
-- 	DString varchar(200),
-- 	AString varchar(200),
-- 	EString varchar(200),
-- 	createDate date
-- );

-- DELETE FROM songtab;
-- INSERT INTO songtab(title, author, minorEString, BString, GString, DString, AString, EString, createdate) VALUES
-- (
-- 	'Shape of You', 'Ed Sheeran', 
-- 	'e|-----------------------------', 
-- 	'B|-0-3-0--0-3-0-0-3-0--2-0-----',
-- 	'G|-2-2-2--0-0-0-0-0-0--2-2-2---', 
-- 	'D|-0-0-0--2-2-2-0-0-0--2-2-2---',
-- 	'A|-2-2-2---------------0-0-0---', 
-- 	'E|-------0-0-0-3-3-3-----------',
-- 	'2022-06-19'
-- ),
-- (
-- 	'Numb', 'Linkin Park', 
-- 	'e|-------0-3-2------------3-2----------', 
-- 	'B|-0-3-0------------0-3-0-----3--------',
-- 	'G|-------------------------------------', 
-- 	'D|--------------------------------0----',
-- 	'A|--------------3----------------------', 
-- 	'E|-------0--------------3--------------',
-- 	'2022-06-19'
-- );

-- SELECT * FROM song, songtab WHERE song.title = songtab.title; -- list matched stuff

-- SELECT song.title, song.author, song.chords, songtab.minorestring, songtab.bstring, songtab.gstring,songtab.dstring, songtab.astring, songtab.estring
-- FROM song, songtab 
-- WHERE song.title = songtab.title; -- list matched stuff, but specify the columns

-- SELECT * FROM song LEFT JOIN songtab ON song.title = songtab.title; -- list all stuff in song, for left table song, if no match:null display

-- SELECT * FROM song RIGHT JOIN songtab ON song.title = songtab.title; -- list all stuff in song, for right table songtab, if no match:null display

-- INSERT INTO song(title, author, capo, chords, createDate, moreInfo) VALUES
-- ('黑色毛衣', '周杰伦', 0, 'Am Dm G','2022-06-19', ''),
-- ('Got You', 'Matt Terry', 0, 'Em G D','2022-06-19', ''),
-- ('10000 Hours', 'Dan + Shay', 0, 'G G/B Cadd9 G','2022-06-19', ''),
-- ('环游星空', 'Gifty', 3, 'G','2022-06-19', '');

-- INSERT INTO songtab(title, author, minorEString, BString, GString, DString, AString, EString, createdate) VALUES
-- (
-- 	'黑色毛衣', '周杰伦', 
-- 	'e|---------------|---------------|------------------------------------------------------12-s-0-', 
-- 	'B|--1-3-s-5-5-6--|--3-3-5-s-6-5--|-3-1-0-1-0-1-p-0-----6--8-10-10-12-13-12-10-1-0-1------------',
-- 	'G|---------------|---------------|------------------2------------------------------------------', 
-- 	'D|---------------|---------------|-------------------------------------------------------------',
-- 	'A|---------------|---------------|-------------------------------------------------------------', 
-- 	'E|---------------|---------------|-------------------------------------------------------------',
-- 	'2022-06-19'
-- ),
-- (
-- 	'Got You', 'Matt Terry', 
-- 	'e|------3------2-------0--0-------', 
-- 	'B|----------------3-3-------------',
-- 	'G|--------------------------------', 
-- 	'D|--4------0----------------------',
-- 	'A|--------------------------------', 
-- 	'E|--------------------------------',
-- 	'2022-06-19'
-- ),
-- (
-- 	'10000 Hours', 'Dan + Shay', 
-- 	'e|-------|----x----------|-------x-------|----x----------|-------x-------|--------------------|--------------------|--------------------|--------------------|', 
-- 	'B|-------|--3-x-3--------|-------x-------|--3-x-3--------|-------x-------|--------------------|--------------------|--------------------|--------------------|',
-- 	'G|-----0-|--0-x-0--------|-0---0-x-0-----|--0-x-0--------|-0---0-x-0-----|--2/4-4-4-2h4-2-0---|-----0-2-2/4--------|--2/4-4-4-2h4-2-0---|-----0-0h2-0--------|', 
-- 	'D|-0h2---|----x----------|-0h2-0-x-0-----|----x----------|-0h2-0-x-0-----|------------------2-|-0h2----------------|------------------2-|-0h2----------------|',
-- 	'A|-------|----x-2--------|-3-----x-------|----x----------|-3-----x-------|--------------------|--------------------|--------------------|--------------------|', 
-- 	'E|-------|-3--x----------|-------x-3-----|-3--x-0--------|-------x-3-----|--------------------|--------------------|--------------------|--------------------|',
-- 	'2022-06-19'
-- ),
-- (
-- 	'环游星空', 'Gifty', 
-- 	'e|---------------------------------------------------', 
-- 	'B|--0-3-3-s-6-3-0------0-1-h-3-----3-s-6-0-----------',
-- 	'G|----------------2-0----------2-0----------2-0----0-', 
-- 	'D|-----------------------------------------------4---',
-- 	'A|---------------------------------------------------', 
-- 	'E|---------------------------------------------------',
-- 	'2022-06-19'
-- ),
-- (
-- 	'Say Something', 'A Great Big World', 
-- 	'e|-------------------------|-------------------------|-------------------------|', 
-- 	'B|-1-----1-----1-----1---1-|-1-----1-----1-----1-----|-1-----1-----1-----1-----|',
-- 	'G|-------------------------|-2-----------2-----------|-0-----------0-----------|', 
-- 	'D|-------------------------|-2-----------3-----------|-2-----------0-----------|',
-- 	'A|-------------------------|-0-----------------------|-3-----------------------|', 
-- 	'E|-------------------------|-------------1-----------|-------------3-----------|',
-- 	'2022-06-19'
-- ),
-- (
-- 	'Such a Fool', 'George Nozuka', 
-- 	'e|-------2h3p2---------------------------0------------------------------|-------2h3p2---------------------------0--------------------------------------|', 
-- 	'B|-----3-------3-------------3---------3------------------0-------------|-----3-------3-------------3---------3----------------------------------------|',
-- 	'G|---0-----------0---------0---------2-----------------2------------2---|---0-----------0---------0---------2-----------------2------------2-----------|', 
-- 	'D|-2---------------2-----2---------0----------------0-------------------|-2---------------2-----2---------0----------------0-----0------0-----0--------|',
-- 	'A|---------------------3------------------------------------------------|---------------------3--------------------------------------------------------|', 
-- 	'E|------------------------------------------------3--------------2------|------------------------------------------------3------------2----------------|',
-- 	'2022-06-19'
-- ),
-- (
-- 	'Pass Me By', 'R5', 
-- 	'e|-------------------------------', 
-- 	'B|-------7--------5--------------',
-- 	'G|-0-s-7------------------7-7-7-7-', 
-- 	'D|---------0-s-7----7-s-9-9-9-9-7-',
-- 	'A|--------------------------------', 
-- 	'E|--------------------------------',
-- 	'2022-06-19'
-- ),
-- (
-- 	'Need You Now', 'Lady Antebellum', 
-- 	'e|-0--------------|-0-----------------0-|-0-------------------0-|-0------------', 
-- 	'B|-1-0-1-----0-1--|-1-0-1-----0-1---1---|-1-0-1-----0-1----1----|-1-0-1--------',
-- 	'G|-0--------------|-0--------------0----|-0---------------0-----|-0------------', 
-- 	'D|-3-----3-2----2-|-3-----3-2-----2-----|-3-----3-2-----2-------|-3-----3-2----',
-- 	'A|-3-------0------|-3-------0-----------|-3-------0-------------|-3-------0----', 
-- 	'E|----------------|---------------------|-----------------------|--------------',
-- 	'2022-06-19'
-- ),
-- (
-- 	'Havana', 'Camila Cabello', 
-- 	'e|-----------6-s-8-6-4-6-2--------', 
-- 	'B|-3-h-6-3-6----------------------',
-- 	'G|--------------------------------', 
-- 	'D|--------------------------------',
-- 	'A|--------------------------------', 
-- 	'E|--------------------------------',
-- 	'2022-06-19'
-- ),
-- (
-- 	'为你唱这首歌2', '殆死悲爱', 
-- 	'e|-8-8-6-5-6-5-888-6-5-6--------1-------------', 
-- 	'B|----------------------2-h-3-2----6-8-6-5-1--',
-- 	'G|--------------------------------------------', 
-- 	'D|--------------------------------------------',
-- 	'A|--------------------------------------------', 
-- 	'E|--------------------------------------------',
-- 	'2022-06-19'
-- ),
-- (
-- 	'Payphone', 'Maroon5',
-- 	'e|-------3-s-5-3-3-s-2-----------------------', 
-- 	'B|-0-1-3---------------3-1-1-0--1-0----------',
-- 	'G|----------------------------0-----2-2-4-2--', 
-- 	'D|-------------------------------------------',
-- 	'A|-------------------------------------------', 
-- 	'E|-------------------------------------------',
-- 	'2022-06-19'
-- ),
-- (
-- 	'Better Than A Hallelujah', 'Amy Grant',
-- 	'e|-------------------', 
-- 	'B|-------------------',
-- 	'G|-----0----2-2-4-2--', 
-- 	'D|-------------------',
-- 	'A|-------------------', 
-- 	'E|-------------------',
-- 	'2022-06-19'
-- );


-- INSERT INTO song(title, author, capo, chords, createDate, moreInfo) VALUES
-- ('Here Comes Forever', 'R5', 0, 'F C G C Am','2022-06-19', ''),
-- ('I Want It That Way', 'Backstreet Boys', 2, 'Em C G Gm D Dsus2 E A F#m','2022-06-19', ''),
-- ('Losing My Mind', 'Charlie Puth', 6, 'Am F C G/B','2022-06-19', ''),
-- ('Melody', '陶喆', 4, 'Am7 Dm7 G E7','2022-06-19', ''),
-- ('Smile', 'R5', 2, 'D A Bm A G D Em A','2022-06-19', ''),
-- ('Some', 'BOL4', 2, 'D Asus4 Bm G','2022-06-19', ''),
-- ('Where the Light Is', 'Dan Bremnes', 4, 'F C G C Am','2022-06-19', ''),
-- ('空空如也', '任然', 6, 'Fmaj7 Em7 Dm7 Cmaj7','2022-06-19', ''),
-- ('我不配', '周杰伦', 3, 'Gmaj7 Em11 D/C D Am Cmaj7 Am7','2022-06-19', '')
-- ;

-- INSERT INTO songtab(title, author, minorEString, BString, GString, DString, AString, EString, createdate) VALUES
-- (
-- 	'I Want It That Way', 'Backstreet Boys', 
-- 	'e|---------------------------------|---------------------------------|x2|---------------------------------|-0------------------2-------3----|', 
-- 	'B|-----0-----1p0-------1-------3---|-----0-----1p0-------1-------3---|x2|-----0-----1p0-------1-------3---|-0---0-----1p0------3-------3----|',
-- 	'G|-------0-------0-----------0---0-|-------0-------0-----------0---0-|x2|-------0-------0-----------0---0-|-0-----0-------0----2-------4----|', 
-- 	'D|---2-----2---------2-----0-------|---2-----2---------2-----0-------|x2|---2-----2---------2-----0-------|-2-2-----2----------0-------5----|',
-- 	'A|-----------------3---------------|-----------------3---------------|x2|-----------------3---------------|-2--------------------------5----|', 
-- 	'E|-0---------------------3---------|-0---------------------3---------|x2|-0---------------------3---------|-0--------------------------3----|',
-- 	'2022-06-19'
-- );