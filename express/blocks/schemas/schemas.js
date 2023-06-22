/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
function decorateSchemasBlocks($block) {
  const rows = Array.from($block.children);
  rows.forEach(($row) => {
    const cells = Array.from($row.children);
    const webApplicationUrl = cells[0];
    const webPageSchemaScript = document.createElement('script');
    webPageSchemaScript.setAttribute('type', 'application/ld+json');
    const webSchemaJson = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      url: window.location.href,
      '@id': ''.concat(window.location.href, '/#webpage'),
      isPartOf: {
        '@type': 'Corporation',
        name: 'Adobe',
        legalName: 'Adobe Inc.',
        alternateName: 'Adobe Inc',
        '@id': 'https://www.adobe.com#organization',
        tickerSymbol: 'ADBE',
        sameAs: [
          'https://www.linkedin.com/company/adobe/',
          'https://www.instagram.com/adobe/',
          'https://twitter.com/Adobe',
          'https://en.wikipedia.org/wiki/Adobe_Inc.'],
      },
      about: {
        '@type': 'WebApplication',
        name: 'Adobe Express',
        url: webApplicationUrl.innerText,
        '@id': ''.concat(webApplicationUrl.innerText, '#webapplication'),
        browserRequirements: ['requires HTML5 support', 'requires JavaScript'],
        sameAs: 'https://www.adobe.com/in/express/',
        applicationCategory: 'DesignApplication',
        applicationSuite: 'Adobe Creative Cloud',
        permissions: 'may run only with an active internet connection',
        operatingSystem: ['Windows 8.1 or later', 'macOS 10.13 or later', 'Chromebook'],
        memoryRequirements: '4-GB',
        copyrightHolder: { '@id': 'https://www.adobe.com#organization' },
        creator: { '@id': 'https://www.adobe.com#organization' },
        publisher: { '@id': 'https://www.adobe.com#organization' },
        maintainer: { '@id': 'https://www.adobe.com#organization' },
        offer: {
          '@type': 'offer',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '0.00',
            priceCurrency: 'INR',
          },
        },
      },
    };
    webPageSchemaScript.textContent = JSON.stringify(webSchemaJson);
    document.head.appendChild(webPageSchemaScript);
  });
}

export default function decorate($block) {
  decorateSchemasBlocks($block);
}
