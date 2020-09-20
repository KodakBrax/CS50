#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

// constant for bytes
const int BYTES = 512;

// function prototypes
int beginJPEG(char byte[]);

int main(int argc, char *argv[])
{
    // check for only one command line argument
    if (argc != 2)
    {
        printf("Usage: ./recover image\n");
        return 1;
    }

    // open memory card file
    FILE *file = fopen(argv[1], "r");

    // check if file is open
    if (file == NULL)
    {
        return 1;
    }

    // loop while the end of the card is false
    bool end = false;
    while (!end)
    {
        // read 512 bytes from file
        char bytes[BYTES];
        fread(bytes, BYTES, 1, file);

        // if start of new jpeg
        int begin = beginJPEG(bytes);
        int counter = 0;
        string filename;
        if (begin == 0)
        {
            // if first jpeg
            if (counter == 0)
            {
                filename = sprintf(filename, "%03i.jpg", counter);
            }
            // else
            else
            {

            }
        }
        // else
        else
        {
            // if already found jpeg
        }
        counter++;
        // check if at end of file
        
    }

    // close files
}

// function to find beginning index of new jpeg file
int beginJPEG(char byte[])
{
    for (int i = 0; i < BYTES - 3; i++)
    {
        if (byte[i] == 0xff && byte[i + 1] == 0xd8 && byte[i + 2] == 0xff && (byte[i + 3] == 0xe0))
        {
            return i;
        }
    }
    return -1;
}