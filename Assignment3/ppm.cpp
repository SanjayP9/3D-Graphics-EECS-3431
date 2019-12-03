#include <stdio.h>

void save_image(int Width, int Height, char* fname,unsigned char* pixels) {
  FILE *fp;
  const int maxVal=255; 
  
  printf("Saving image %s: %d x %d\n", fname,Width,Height);
  fp = fopen(fname,"wb");
  if (!fp) {
        printf("Unable to open file '%s'\n",fname);
        return;
  }
  fprintf(fp, "P6\n");
  fprintf(fp, "%d %d\n", Width, Height);
  fprintf(fp, "%d\n", maxVal);

  for(int j = 0; j < Height; j++) {
		  fwrite(&pixels[j*Width*3], 3,Width,fp);
  }

  fclose(fp);
}

/*
// This main function is meant only to illustrate how to use the save_image function.
// You should get rid of this code, and just paste the save_image function into your
// raytrace.cpp code. 
int main() {
	int Width = 128;	// Move these to your setup function. The actual resolution will be
	int Height= 128;	// specified in the input file
    char fname[20] = "scene.ppm"; //This should be set based on the input file
	unsigned char *pixels; 
	// This will be your image. Note that pixels[0] is the top left of the image and
	// pixels[3*Width*Height-1] is the bottom right of the image.
    pixels = new unsigned char [3*Width*Height];

	// This loop just creates a gradient for illustration purposes only. You will not use it.
	for(int i = 0; i < Height; i++) {
		for (int k = 0; k < 3*Width; k++) {
			pixels[i*Width*3+k] = i+k/3;
		}
	}
	save_image(Width, Height, fname, pixels);
}
*/