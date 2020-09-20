from cs50 import get_string
from sys import argv, exit
import csv

def main():
    # check if length of command line arguments is correct
    if len(argv) != 3:
        print('Usage: python dna.py data.csv sequence.txt')
        exit(1)

    # open csv file and make names dictionary
    names = {}
    with open(argv[1], newline='') as csvfile:
        info = csv.reader(csvfile)
        for row in info:
            names[row[0]] = row[1: len(row)]
    genomes = names['name']
    
    # open text file
    f = open(argv[2], 'r')
    dna = f.read()
    
    count = []
    for seq in genomes: 
        maxcounter = 0
        counter = 0
        position = 0
        previouspos = 0
        
        while position < len(dna):
            position = dna.find(seq, position)
            if position == -1:
                counter = 0
                break
            elif (position != -1) and previouspos == 0:
                counter += 1
                maxcounter = 1
                previouspos = position
            elif (position != -1) and ((position - len(seq)) == previouspos):
                counter += 1
                previouspos = position
                if maxcounter < counter:
                    maxcounter = counter
            elif (position != -1) and ((position - len(seq)) != previouspos):
                counter = 1
                previouspos = position
                if maxcounter < counter:
                    maxcounter = counter
            position += 1
        count.append(str(maxcounter))
    for name in names:
        if count == names[name]:
            print(f'{name}')
            exit(0)
    print('No match')
    
main()