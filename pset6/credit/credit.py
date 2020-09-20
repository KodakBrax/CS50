from cs50 import get_string
from cs50 import get_int

def main():
    # get number from user
    n = get_int("Number: ")
    # make sure positive number
    while n < 0:
        n = get_int("Number: ")
    
    count = len(str(n))
    
    firstDigs1 = str(n)[0:2]
    
    i = 1
    nSum = 0
    
    while n > 0:
        digit = n % 10
        if i % 2 == 0:
            digit = digit * 2
            nSum = nSum + digit % 10 + digit // 10
        else:
            nSum = nSum + digit
        n = n // 10
        i += 1
        
    firstDigs = int(firstDigs1)
    if count == 15 and (firstDigs == 34 or firstDigs == 37) and nSum % 10 == 0:
        print("AMEX")
    elif count == 16 and (firstDigs > 50 and firstDigs < 56) and nSum % 10 == 0:
        print("MASTERCARD")
    elif (count == 13 or count == 16) and firstDigs // 10 == 4 and nSum % 10 == 0:
        print("VISA")
    else:
        print("INVALID")
main()