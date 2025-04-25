class TreeNode 
{
    constructor(attribute = null, value = null, isLeaf = false, classification = null) 
    {
        this.attribute = attribute;
        this.value = value;
        this.isLeaf = isLeaf;
        this.classification = classification;
        this.children = {};
    }
}

class DecisionTree 
{
    constructor() 
    {
        this.root = null;
        this.header = [];
    }

    buildTree(data, attributes, targetAttribute) 
    {
        const classifications = data.map(row => row[targetAttribute]);
        if (new Set(classifications).size === 1)
            return new TreeNode(null, null, true, classifications[0]);
        
        if (attributes.length === 0) 
        {
            const mostCommon = this.mostCommonValue(classifications);
            return new TreeNode(null, null, true, mostCommon);
        }

        const bestAttr = this.chooseBestAttribute(data, attributes, targetAttribute);
        const treeNode = new TreeNode(bestAttr);

        const attrValues = [...new Set(data.map(row => row[bestAttr]))];

        for (const value of attrValues) 
        {
            const subset = data.filter(row => row[bestAttr] === value);
            
            if (subset.length === 0) 
            {

                const mostCommon = this.mostCommonValue(classifications);
                treeNode.children[value] = new TreeNode(null, null, true, mostCommon);
            } 
            else 
            {
                const remainingAttributes = attributes.filter(attr => attr !== bestAttr);
                treeNode.children[value] = this.buildTree(subset, remainingAttributes, targetAttribute);
            }
        }

        return treeNode;
    }

    chooseBestAttribute(data, attributes, targetAttribute) 
    {
        let bestAttr = attributes[0];
        let maxGain = -Infinity;

        for (const attribute of attributes) 
        {
            const gain = this.informationGain(data, attribute, targetAttribute);
            if (gain > maxGain) 
            {
                maxGain = gain;
                bestAttr = attribute;
            }
        }

        return bestAttr;
    }

    entropy(data, targetAttribute) 
    {
        const counts = {};
        data.forEach(row => 
        {
            const val = row[targetAttribute];
            counts[val] = (counts[val] || 0) + 1;
        });

        let entropy = 0;
        const length = data.length;
        for (const key in counts) 
        {
            const p = counts[key] / length;
            entropy -= p * Math.log2(p);
        }
        return entropy;
    }

    informationGain(data, attribute, targetAttribute) 
    {
        const totalEntropy = this.entropy(data, targetAttribute);
        const values = [...new Set(data.map(row => row[attribute]))];

        let remainder = 0;
        for (const value of values) 
        {
            const subset = data.filter(row => row[attribute] === value);
            const subsetEntropy = this.entropy(subset, targetAttribute);
            remainder += (subset.length / data.length) * subsetEntropy;
        }

        return totalEntropy - remainder;
    }

    mostCommonValue(arr) 
    {
        const count = {};
        for (const value of arr) 
        {
            if (count[value]) 
                count[value]++;
            else 
                count[value] = 1;
        }
        let mostCommon;
        let maxCount = 0;
        for (const value in count) 
        {
            if (count[value] > maxCount) 
            {
                mostCommon = value;
                maxCount = count[value];
            }
        }
        
        return mostCommon;
    }

    classify(row, node = null, path = []) 
    {
        if (node === null) node = this.root;
        
        if (node.isLeaf) 
        {
            return 
            {
                classification: node.classification,
                path: [...path, `Target attribute: ${node.classification}`]
            };
        }
        
        const attrValue = row[node.attribute];
        const childNode = node.children[attrValue];
        
        if (!childNode) 
        {
            const mostCommonChild = this.mostCommonValue(Object.values(node.children).map
            (
                n => n.isLeaf ? n.classification : this.getMostCommonClassification(n)
            ));
            return 
            {
                classification: mostCommonChild,
                path: [...path, `Strange value... "${node.attribute}: ${attrValue}", the most frequent target attribute is used: ${mostCommonChild}`]
            };
        }
        
        path.push(`${node.attribute} = ${attrValue}`);
        return this.classify(row, childNode, path);
    }

    getMostCommonClassification(node) 
    {
        if (node.isLeaf) return node.classification;
        
        const classifications = [];
        for (const child of Object.values(node.children)) 
        {
            classifications.push(this.getMostCommonClassification(child));
        }
        
        return this.mostCommonValue(classifications);
    }

    visualize(node = null, depth = 0) 
    {
        if (node === null) node = this.root;
        let result = '';
        
        const indent = '  '.repeat(depth);
        if (node.isLeaf) 
        {
            result += `${indent}├─ Target attribute: ${node.classification}\n`;
        } 
        else 
        {
            result += `${indent}├─ ${node.attribute}\n`;
            for (const [value, child] of Object.entries(node.children)) 
            {
                result += `${indent}|  ├─ ${value}\n`;
                result += this.visualize(child, depth + 3);
            }
        }
        
        return result;
    }
}


document.addEventListener('DOMContentLoaded', () => 
{
    const tree = new DecisionTree();
    const trainingDataTextArea = document.getElementById('trainingData');
    const buildTreeButton = document.getElementById('buildTree');
    const newDataTextArea = document.getElementById('newData');
    const classifyDataButton = document.getElementById('classifyData');
    const treeVisualization = document.getElementById('treeVisualization');
    const results = document.getElementById('classificationResults');

    buildTreeButton.addEventListener('click', () => 
    {
        try 
        {
            const { data, header } = parseCSV(trainingDataTextArea.value);
            if (header.length < 2) 
                throw new Error('The CSV must contain at least one attribute and a target variable');
            
            tree.header = header;
            const targetAttribute = header[header.length - 1];
            const attributes = header.slice(0, header.length - 1);
            
            tree.root = tree.buildTree(data, attributes, targetAttribute);
            treeVisualization.innerHTML = `<pre>${tree.visualize()}</pre>`;
            
            results.innerHTML = 'The tree has been successfully built!';
        } 
        catch (error) 
        {
            alert(`Error when building a tree: ${error.message}`);
        }
    });

    classifyDataButton.addEventListener('click', () => 
    {
        try 
        {
            if (!tree.root) 
                throw new Error('Firstly, build a tree');
            
            const { data, header } = parseCSV(newDataTextArea.value);
            if (!arraysEqual(header.slice(0, -1), tree.header.slice(0, -1))) 
                throw new Error('Data headers do not match the training sample');
    
            
            let resultsHtml = '';
            for (const row of data) 
            {
                const { classification, path } = tree.classify(row);
                resultsHtml += `
                    <div class="classification-path">
                        <div>Classification path:</div>
                        <div>${path.join(' → ')}</div>
                        <div class="classification-result">Result: ${classification}</div>
                    </div>
                `;
            }
            
            results.innerHTML = resultsHtml || 'No data for classification';
        } 
        catch (error) 
        {
            alert(`Classification error: ${error.message}`);
        }
    });

    function parseCSV(csvText) 
    {
        const lines = csvText.trim().split('\n').map(line => line.trim());
        if (lines.length < 2) 
            throw new Error('The CSV must contain headers and at least one line of data');
        
        const header = lines[0].split(',').map(item => item.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) 
        {
            const values = lines[i].split(',').map(item => item.trim());
            if (values.length !== header.length) 
                throw new Error('The number of values in the row does not match the headings');
            
            const row = {};
            header.forEach((attr, index) => 
            {
                row[attr] = values[index];
            });
            data.push(row);
        }
        
        return { data, header };
    }

    function arraysEqual(a, b) 
    {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;
        
        for (let i = 0; i < a.length; i++) 
        {
            if (a[i] !== b[i]) return false;
        }
        
        return true;
    }
});
