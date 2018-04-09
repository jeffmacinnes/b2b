"""
General Use Tools for use with PsychoPy
"""
import os, sys
import json



def writeSettings(fname, dataDict):
    """
    take settings stored in dict, and write to JSON file
    """
    with open(fname, 'w') as outfile:
        json.dump(dataDict, outfile)


def loadSettings(fname):
    """
    Load json file, return dict with settings
    """
    with open(fname, 'r') as f:
        dataDict = json.load(f)

    return dataDict
