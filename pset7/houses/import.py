from sys import argv, exit
import csv
from cs50 import SQL

def main():
    # check for command line arguments
    if len(argv) != 2:
        print('Incorrect number of arguments')
        exit(1)

    # open csv file
    info = csv.DictReader(open(argv[1]))
    
    # open sql database
    db = SQL("sqlite:///students.db")
    
    for row in info: 
        
        full = row['name'].split()
        
        if len(full) < 3:
            db.execute("INSERT INTO students (first, middle, last, house, birth) VALUES(?, ?, ?, ?, ?)",
            full[0], None, full[1], row['house'], row['birth'])
        else:
            db.execute("INSERT INTO students (first, middle, last, house, birth) VALUES(?, ?, ?, ?, ?)",
            full[0], full[1], full[2], row['house'], row['birth'])
    


main()