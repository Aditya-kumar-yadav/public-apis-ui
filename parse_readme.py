import re
import json
import os

def parse_readme():
    with open('README.md', 'r', encoding='utf-8') as f:
        content = f.read()

    categories = {}
    current_category = None

    lines = content.split('\n')
    passed_index = False
    for line in lines:
        if line.startswith('## Index'):
            passed_index = True
            
        if not passed_index:
            continue
            
        if line.startswith('### '):
            current_category = line[4:].strip()
            categories[current_category] = []
        elif current_category and line.startswith('|') and not line.startswith('|:') and not line.startswith('| API') and not line.startswith('| Name'):
            # Parse table row
            parts = [p.strip() for p in line.split('|')[1:-1]]
            if len(parts) >= 5:
                # Extract name and URL from markdown link
                match = re.match(r'\[(.*?)\]\((.*?)\)', parts[0])
                if match:
                    name = match.group(1)
                    url = match.group(2).split(' ')[0] # Handle any trailing spaces or extra attributes
                    
                    api = {
                        'name': name,
                        'url': url,
                        'description': parts[1],
                        'auth': parts[2],
                        'https': parts[3],
                        'cors': parts[4]
                    }
                    categories[current_category].append(api)

    # Flatten into a list of APIs with category attached for easier UI consumption
    apis_list = []
    for cat, apis in categories.items():
        for api in apis:
            api['category'] = cat
            apis_list.append(api)

    with open('apis.json', 'w', encoding='utf-8') as f:
        json.dump(apis_list, f, indent=2)
    
    print(f"Parsed {len(apis_list)} APIs into apis.json")

if __name__ == '__main__':
    parse_readme()
