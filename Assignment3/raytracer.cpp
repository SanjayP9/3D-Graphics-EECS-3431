// Assignment3.cpp : This file contains the 'main' function. Program execution begins and ends there.

#include <iostream>
#include <string>
#include "glm-master/glm/glm.hpp"
#include "glm-master/glm/ext.hpp"
#include <vector>
#include <fstream>
#include <regex>


struct Sphere
{
	std::string name;
	glm::vec4 pos;
	glm::vec3 scale;
	glm::vec3 color;
	float kA, kD, kS, kR;
	int n;
	glm::mat4 transformationMatrix;
	glm::mat4 inverseMatrix;
};

struct Light
{
	std::string name;
	glm::vec4 pos;
	glm::vec3 intensity;
};

struct Commands
{
	float near;
	float left;
	float right;
	float bottom;
	float top;
	int nColumns;
	int nRows;
	std::vector<Sphere> sphereList;
	std::vector<Light> lightList;
	glm::vec3 back;
	glm::vec3 ambient;
	std::string outputName;
};

std::vector<std::string> split(std::string str) {
	std::regex words_regex("\\s");
	auto words_begin = std::sregex_iterator(str.begin(), str.end(), words_regex);
	auto words_end = std::sregex_iterator();

	for (std::sregex_iterator i = words_begin; i != words_end; ++i)
		std::cout << (*i).str() << '\n';
}

Commands commands;

void parseInput(std::string fileName)
{
	if (fileName.substr(fileName.length() - 4) != ".txt")
	{
		return;
	}

	std::ifstream file(fileName);
	if (!file.is_open())
	{
		return;
	}
	
	std::string line;
	std::vector<std::string> splitString;
	std::string commandName;

	while (getline(file, line))
	{
		if (line.size() > 20)
		{
			return;
		}

		splitString = split(line);
			

		std::string commandName;

		if (splitString.size() >= 2)
		{

			if (splitString[0] == "NEAR")
			{
				commandName = splitString[0];

				commands.near = stof(splitString[1]);
			}
			else if (splitString[0] == "LEFT")
			{
				commandName = splitString[0];
				commands.left = stof(splitString[1]);
			}
			else if (splitString[0] == "RIGHT")
			{
				commandName = splitString[0];
				commands.right = stof(splitString[1]);
			}
			else if (splitString[0] == "BOTTOM")
			{
				commandName = splitString[0];
				commands.bottom = stof(splitString[1]);
			}
			else if (splitString[0] == "TOP")
			{
				commandName = splitString[0];
				commands.top = stof(splitString[1]);
			}
			else if (splitString[0] == "RES")
			{
				commandName = splitString[0];
				commands.nColumns = stoi(splitString[1]);
				commands.nRows = stoi(splitString[2]);
			}
			else if (splitString[0] == "SPHERE")
			{
				commandName = splitString[0];
				Sphere tempSphere;
				tempSphere.name = splitString[1];
				tempSphere.pos[0] = stof(splitString[2]);
				tempSphere.pos[1] = stof(splitString[3]);
				tempSphere.pos[2] = stof(splitString[3]);
				tempSphere.pos[3] = 0;

				tempSphere.scale.x = stof(splitString[4]);
				tempSphere.scale.y = stof(splitString[5]);
				tempSphere.scale.z = stof(splitString[6]);

				tempSphere.color.r = stof(splitString[7]);
				tempSphere.color.g = stof(splitString[8]);
				tempSphere.color.b = stof(splitString[9]);

				tempSphere.kA = stof(splitString[10]);
				tempSphere.kD = stof(splitString[11]);
				tempSphere.kS = stof(splitString[12]);
				tempSphere.kR = stof(splitString[13]);

				tempSphere.n = stoi(splitString[14]);

				commands.sphereList.push_back(tempSphere);
			}
			else if (splitString[0] == "LIGHT")
			{
				commandName = splitString[0];
				Light tempLight;
				tempLight.name = splitString[1];

				tempLight.pos[0] = stof(splitString[2]);
				tempLight.pos[1] = stof(splitString[3]);
				tempLight.pos[2] = stof(splitString[4]);
				tempLight.pos[3] = 0;

				tempLight.intensity.r = stof(splitString[5]);
				tempLight.intensity.g = stof(splitString[6]);
				tempLight.intensity.b = stof(splitString[7]);

				commands.lightList.push_back(tempLight);
			}
			else if (splitString[0] == "BACK")
			{
				commandName = splitString[0];
				commands.back.r = stof(splitString[1]);
				commands.back.g= stof(splitString[2]);
				commands.back.b = stof(splitString[3]);
			}
			else if (splitString[0] == "AMBIENT")
			{
				commandName = splitString[0];
				commands.ambient.r = stof(splitString[1]);
				commands.ambient.g = stof(splitString[2]);
				commands.ambient.b = stof(splitString[3]);
			}
			else if (splitString[0] == "OUTPUT")
			{
				commandName = splitString[0];
				commands.outputName = splitString[1];
			}
		}
	}
}

//int main(const int argc, char* arg[])
int main()
{
	/*if (argc != 2)
	{
		std::cout << "Invalid arguement count";
		return -1;
	}*/

	// Parse Input
	parseInput("\Project3TestsAndKeys\Project3TestsAndKeys\testAmbient.txt");
	std::cout << "yeet";
}



// Run program: Ctrl + F5 or Debug > Start Without Debugging menu
// Debug program: F5 or Debug > Start Debugging menu

// Tips for Getting Started: 
//   1. Use the Solution Explorer window to add/manage files
//   2. Use the Team Explorer window to connect to source control
//   3. Use the Output window to see build output and other messages
//   4. Use the Error List window to view errors
//   5. Go to Project > Add New Item to create new code files, or Project > Add Existing Item to add existing code files to the project
//   6. In the future, to open this project again, go to File > Open > Project and select the .sln file
