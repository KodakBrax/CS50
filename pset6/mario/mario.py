from cs50 import get_int

def main():
    height = get_positive_int()
    
    for i in range(1,height+1):
        for j in reversed(range(height)):
            if j >= i:
                print(" ", end="")
            else:
                print("#", end="")
        
        print("  ", end="")
        
        for k in range(i):
            print("#", end="")
        
        print()
    
def get_positive_int():
    while True:
        n = get_int("Height: ")
        if n > 0 and n < 9:
            break
    return n

main()