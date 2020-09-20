SELECT movies.title FROM people 
JOIN stars ON stars.person_id = people.id 
JOIN movies ON stars.movie_id = movies.id 
JOIN ratings ON movies.id = ratings.movie_id 
WHERE people.name = "Chadwick Boseman" 
ORDER BY rating DESC LIMIT 5;         

