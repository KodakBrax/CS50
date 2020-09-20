#include <stdio.h>
#include <cs50.h>

int main(void) {
    int height = get_int("Height: ");
    while(height < 1 || height > 8) {
        height = get_int("Height: ");
    }

    for (int i = 1; i <= height; i++) {
        for(int j = height; j > 0; j--) {
            if(j > i) {
                printf(" ");
            } else {
                printf("#");
            }
        }
        
        printf("  ");
        
        for(int k = 0; k <i ; k++) {
            printf("#");
        }
        printf("\n");
    }
}