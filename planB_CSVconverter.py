#! /usr/bin/env python

import csv
from xml.dom.minidom import Document

data = csv.DictReader (open("planB.csv",'U'))
#Create the XML doc
doc = Document()

#create the base element
docbase = doc.createElement("docbase")

doc.appendChild(docbase)

fundedTotal=0

ProjectArray = []
for row in data:
	
	Pid= row['ID']
	funded = row['Funded']
	cost = row['Cost']
	if funded == 'true':
		fundedTotal += int(cost)
	Project = doc.createElement('Project')
	Project.setAttribute('descript', row['Project'])
	Project.setAttribute('Pid', Pid)
	Project.setAttribute('type', row["Type"])
	Project.setAttribute('Location', row['Location'])
	Project.setAttribute('Cost', cost)
	Project.setAttribute('finishDate', row['FinishDate'])
	Project.setAttribute('ProjType', row['ProjType'])
	Project.setAttribute('Funded', funded)
	ProjectArray.append(Project)		
	docbase.appendChild(Project)

docbase.setAttribute('fundedTotal', str(fundedTotal)) #you MUST convert to string to avoid parse errors
f = open('planB.xml', 'w')
doc.writexml(f, addindent=" ", newl="\n")
f.close()