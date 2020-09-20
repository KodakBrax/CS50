from sys import argv, exit
from cs50 import SQL

def main():
    # check number of command line arguments
    if len(argv) != 2:
        print('Not enough command line arguments')
        exit(1)
        
    db = SQL('sqlite:///students.db')
    
    info = db.execute("SELECT * FROM students WHERE house = (?) ORDER BY last", argv[1])
    
    for row in info:
        if row['middle'] == None:
            print(f"{row['first']} {row['last']}, born {row['birth']}")
        else:
            print(f"{row['first']} {row['middle']} {row['last']}, born {row['birth']}")
main()
