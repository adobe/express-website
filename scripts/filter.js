async function fetchBlogIndex() {
    const resp=await fetch('/blog-index.json');
    const json=await resp.json();
    return (json.data);
  }
  
  async function filterBlogPosts(locale, filters) {
    if (!window.blogIndex) {
        window.blogIndex=await fetchBlogIndex();
    }
    const index=window.blogIndex;
  
    const f={};
    for (let name in filters) {
        const vals=filters[name];
        let v=vals;
        if (!Array.isArray(vals)) {
            v=[vals];
        }
        console.log(v);
        f[name]=v.map(e => e.toLowerCase().trim());
    }
  
    const result=index.filter((post) => {
      let matchedAll=true;
        for (let name in f) {
            let matched=false;
            f[name].forEach((val) => {
                if (post[name].toLowerCase().includes(val)) {
                    matched=true;
                }
            });
            if (!matched) {
              matchedAll=false;
              break;
            }
        }
        return (matchedAll);
    });
  
    return (result);
  }
  