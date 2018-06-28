"""
Tool to quickly run a classifier on a supplied functional run using a
supplied mask
"""

import sys
import os
import argparse
import pickle

import numpy as np
import pandas as pd

from nilearn.input_data import NiftiMasker
from sklearn.svm import SVC
from sklearn.cross_validation import KFold
from sklearn.cross_validation import cross_val_score


labelsFile = 'fullRunLabels_excl2.txt'

def classifyRun(funcFile, maskFile):
    """ Train an SVM classifier on the given funcFile, using the given
    maskFile to select features

    """
    # set up the masker to mask and standardize the input data
    masker = NiftiMasker(mask_img=maskFile, standardize=True)

    # load the func run, and apply masker
    fmri = masker.fit_transform(funcFile)

    ### MASK FMRI TIMEPTS TO ONLY THE CONDITIONS OF INTEREST
    # load labels
    labelsTmp = np.genfromtxt(labelsFile, dtype='str')
    labels = pd.Series(labelsTmp)
    conditions_mask = labels.isin(['Rest', 'Active'])

    # mask the fmri
    fmri = fmri[conditions_mask]

    # mask the labels
    labels = labels[conditions_mask]

    # build the SVM decoder
    clf = SVC(kernel='linear', C=1, probability=True)

    ## See how the classifier performs
    # set up cross-validator
    cv = KFold(n=len(fmri), n_folds=8)

    # run cross-validation
    cv_score = cross_val_score(clf, fmri, labels, cv=cv)

    # print results
    print('mean accuracy: {}, stdDev: {}'.format(np.mean(cv_score), np.std(cv_score)))

    ## Retrain the classifier using full run, and save
    clf.fit(fmri, labels)

    # save
    clf_fname = 'pilot2_classifier.pkl'
    with open(clf_fname, 'wb') as p:
        pickle.dump(clf, p, pickle.HIGHEST_PROTOCOL)
    print('Classifier saved as: {}'.format(clf_fname))


if __name__ == '__main__':
    # parse arguments
    parser = argparse.ArgumentParser(description='SVM classification')
    parser.add_argument('funcFile',
                        help='full path to the functional nifti image')
    parser.add_argument('maskFile',
                        help='full path to the functional space mask file')
    args = parser.parse_args()

    # check if valid inputs
    for f in [args.funcFile, args.maskFile]:
        if not os.path.exists(f):
            print('Input file not found: {}'.format(f))

    # run the classifier
    classifyRun(args.funcFile, args.maskFile)
